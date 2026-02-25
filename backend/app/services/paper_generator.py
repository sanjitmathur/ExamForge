"""Generate exam papers using Gemini AI with questions from the user's bank as context."""

import json
import logging
import threading
import traceback
import google.generativeai as genai
from ..database import SyncSessionLocal
from ..models import GeneratedPaper, ExtractedQuestion, Conversation, UploadedPaper, UserLearning
from ..config import settings

log = logging.getLogger(__name__)


# ── Learning extraction ──────────────────────────────────────────────────────

EXTRACT_LEARNINGS_PROMPT = """Analyze the following conversation between a user and an AI about refining an exam paper.
Extract ONLY reusable preferences — rules, formatting choices, content guidelines, or style instructions
that should be applied to ALL future exam papers for this user.

RULES:
- Do NOT extract one-time requests (e.g. "change question 3 to be about photosynthesis")
- Do NOT extract anything uncertain or ambiguous
- Do NOT repeat any of the existing learnings listed below
- Each learning should be a short, clear instruction (one sentence)
- Categorize each as: formatting, content, style, structure, or general

EXISTING LEARNINGS (do not duplicate these):
{existing_learnings}

CONVERSATION:
{conversation}

Return a JSON array of objects. If there are no new reusable preferences, return an empty array [].
Example: [{{"category": "formatting", "learning": "Always bold section headers"}}, {{"category": "content", "learning": "Include Bloom's taxonomy level for each question"}}]

JSON array:"""


def _get_user_learnings_block(user_id: int, session) -> str:
    """Fetch active learnings and format as a prompt block."""
    learnings = (
        session.query(UserLearning)
        .filter(UserLearning.user_id == user_id, UserLearning.is_active == True)
        .order_by(UserLearning.created_at.desc())
        .limit(20)
        .all()
    )
    if not learnings:
        return ""
    lines = [f"- [{l.category}] {l.learning}" for l in learnings]
    return (
        "\n\nUSER PREFERENCES (learned from previous sessions — always apply these):\n"
        + "\n".join(lines)
    )


def extract_learnings(paper_id: int, user_id: int):
    """Background: call Gemini to extract reusable preferences from conversation."""
    session = SyncSessionLocal()
    try:
        conversations = (
            session.query(Conversation)
            .filter(Conversation.generated_paper_id == paper_id)
            .order_by(Conversation.created_at)
            .all()
        )
        if len(conversations) < 2:
            return

        conv_text = "\n".join(
            f"{c.role.upper()}: {c.content[:500]}" for c in conversations[-6:]  # last 6 messages
        )

        existing = (
            session.query(UserLearning)
            .filter(UserLearning.user_id == user_id, UserLearning.is_active == True)
            .all()
        )
        existing_text = "\n".join(f"- [{l.category}] {l.learning}" for l in existing) or "(none)"

        prompt = EXTRACT_LEARNINGS_PROMPT.format(
            existing_learnings=existing_text,
            conversation=conv_text,
        )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        new_learnings = json.loads(raw)
        if not isinstance(new_learnings, list):
            return

        existing_texts = {l.learning.lower().strip() for l in existing}

        for item in new_learnings[:5]:  # max 5 per extraction
            learning_text = item.get("learning", "").strip()
            category = item.get("category", "general").strip().lower()
            if not learning_text:
                continue
            if learning_text.lower().strip() in existing_texts:
                continue
            if category not in ("formatting", "content", "style", "structure", "general"):
                category = "general"

            session.add(UserLearning(
                user_id=user_id,
                category=category,
                learning=learning_text,
                source_paper_id=paper_id,
                is_active=True,
            ))
            existing_texts.add(learning_text.lower().strip())

        session.commit()
        log.info("Extracted learnings for user %d from paper %d", user_id, paper_id)

    except Exception as e:
        log.warning("Learning extraction failed (non-critical): %s", e)
        session.rollback()
    finally:
        session.close()


def _clean_paper_content(text: str) -> str:
    """Strip AI preamble/conversational text before actual paper content.
    Looks for markdown heading or bold line as the real start of the paper."""
    lines = text.strip().split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Paper likely starts at a markdown heading or bold header
        if stripped.startswith('#') or (stripped.startswith('**') and stripped.endswith('**')):
            return '\n'.join(lines[i:]).strip()
        # Also catch --- separator that starts the paper
        if stripped == '---' and i < len(lines) - 1:
            next_line = lines[i + 1].strip()
            if next_line.startswith('#') or next_line.startswith('**'):
                return '\n'.join(lines[i:]).strip()
    # No preamble detected, return as-is
    return text.strip()

GENERATE_PROMPT = """You are an expert exam paper creator for {board} board, Grade {grade}, {subject}.

Using the question bank below as reference material and style guide, create a NEW original exam paper.

Requirements:
- Title: {title}
- Total marks: {total_marks}
- Duration: {duration} minutes
- Difficulty mix: {difficulty_mix}
- Topics to cover: {topics}
- Question types to include: {question_types}
{additional_instructions}

REFERENCE QUESTION BANK (use as style/difficulty reference, do NOT copy directly):
---
{question_bank}
---

{format_reference}

CRITICAL FORMATTING RULES:
- Question numbering MUST always start from 1, never 0.
- You MUST replicate the exact structure, numbering style, section organization, header format, and marks layout from the reference paper provided above.
- Match the reference paper's section headings (e.g. Section A, Section B), question grouping, and marks distribution pattern exactly.
- Preserve the same style of marks indication (e.g. "[2 marks]", "(2)", "2M") as used in the reference.

Generate TWO sections in your response, separated by the exact marker "===ANSWER_KEY===":

1. FIRST: The complete exam paper in Markdown format with:
   - Paper header matching the reference format (school name, logo placement, exam title, subject, grade, marks, duration)
   - Clear instructions for students
   - Numbered questions organized by sections exactly as in the reference paper
   - Marks indicated for each question

2. AFTER the marker "===ANSWER_KEY===": The complete answer key in Markdown with answers for every question.

Output the paper now:"""


def generate_paper_background(paper_id: int):
    """Run in a background thread. Generates paper content using Gemini."""
    session = SyncSessionLocal()
    try:
        paper = session.get(GeneratedPaper, paper_id)
        if not paper:
            return

        # Gather questions from user's bank for context
        questions = session.query(ExtractedQuestion).filter(
            ExtractedQuestion.user_id == paper.user_id,
            ExtractedQuestion.subject == paper.subject,
        ).limit(50).all()

        question_bank = ""
        for q in questions:
            question_bank += f"- [{q.question_type}][{q.difficulty}] {q.question_text}\n"
            if q.answer_text:
                question_bank += f"  Answer: {q.answer_text}\n"

        if not question_bank:
            question_bank = "(No reference questions available - generate original content)"

        # Fetch format reference from the most recent uploaded paper for this subject
        ref_paper = session.query(UploadedPaper).filter(
            UploadedPaper.user_id == paper.user_id,
            UploadedPaper.subject == paper.subject,
            UploadedPaper.status == "completed",
            UploadedPaper.extracted_text.isnot(None),
        ).order_by(UploadedPaper.created_at.desc()).first()

        if ref_paper and ref_paper.extracted_text:
            format_reference = (
                "FORMAT REFERENCE (replicate this paper's layout, header style, section structure, "
                "school name position, and overall formatting — but generate NEW questions):\n"
                "---\n"
                f"{ref_paper.extracted_text[:5000]}\n"
                "---"
            )
        else:
            format_reference = ""

        topics = json.loads(paper.topics_json) if paper.topics_json else ["General"]
        difficulty_mix = json.loads(paper.difficulty_mix_json) if paper.difficulty_mix_json else {"easy": 3, "medium": 4, "hard": 3}

        # Inject learned user preferences
        learnings_block = _get_user_learnings_block(paper.user_id, session)

        prompt = GENERATE_PROMPT.format(
            board=paper.board or "General",
            grade=paper.grade_level or "10",
            subject=paper.subject or "General",
            title=paper.title,
            total_marks=paper.total_marks or 100,
            duration=paper.duration_minutes or 180,
            difficulty_mix=json.dumps(difficulty_mix),
            topics=", ".join(topics),
            question_types="all types",
            additional_instructions=learnings_block,
            question_bank=question_bank[:20000],
            format_reference=format_reference,
        )

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        response_text = response.text

        if "===ANSWER_KEY===" in response_text:
            parts = response_text.split("===ANSWER_KEY===", 1)
            paper.content_markdown = _clean_paper_content(parts[0])
            paper.answer_key_markdown = _clean_paper_content(parts[1])
        else:
            paper.content_markdown = _clean_paper_content(response_text)
            paper.answer_key_markdown = "*Answer key was not generated separately. Please use chat to request it.*"

        paper.status = "completed"
        session.commit()
        log.info("Paper %d generated successfully", paper_id)

    except Exception as e:
        log.error("Paper %d generation failed: %s\n%s", paper_id, e, traceback.format_exc())
        try:
            paper = session.get(GeneratedPaper, paper_id)
            if paper:
                paper.status = "failed"
                paper.error_message = str(e)[:500]
                session.commit()
        except Exception:
            session.rollback()
    finally:
        session.close()


def refine_paper_with_chat(paper_id: int, user_message: str, user_id: int):
    """Send conversation history + current paper to Gemini for refinement."""
    session = SyncSessionLocal()
    try:
        paper = session.get(GeneratedPaper, paper_id)
        if not paper:
            return None, []

        # Save user message
        user_msg = Conversation(
            generated_paper_id=paper_id,
            user_id=user_id,
            role="user",
            content=user_message,
        )
        session.add(user_msg)
        session.commit()

        # Build conversation history for Gemini chat
        conversations = session.query(Conversation).filter(
            Conversation.generated_paper_id == paper_id
        ).order_by(Conversation.created_at).all()

        # Inject learned user preferences
        learnings_block = _get_user_learnings_block(user_id, session)

        # System context about current paper
        system_context = (
            f"You are helping refine an exam paper. The current paper content is:\n\n"
            f"---PAPER---\n{paper.content_markdown}\n---END PAPER---\n\n"
            f"---ANSWER KEY---\n{paper.answer_key_markdown}\n---END ANSWER KEY---\n\n"
            f"CRITICAL RULES:\n"
            f"- Question numbering MUST always start from 1, never 0.\n"
            f"- Preserve the paper's existing structure, section organization, header format, and marks layout.\n"
            f"- When the user asks for changes, output ONLY the complete updated paper and answer key "
            f"separated by the exact marker '===ANSWER_KEY==='.\n"
            f"- Do NOT include any conversational text, explanations, or preamble before the paper content. "
            f"Start directly with the paper header/title.\n"
            f"- If the user is just asking a question (not requesting changes), respond normally without the marker."
            f"{learnings_block}"
        )

        # Build Gemini chat history (all messages except the last user message)
        history = [
            {"role": "user", "parts": [system_context]},
            {"role": "model", "parts": ["I understand. I have the current exam paper and answer key. What changes would you like me to make?"]},
        ]

        for conv in conversations[:-1]:  # Exclude last message (we'll send it via send_message)
            role = "model" if conv.role == "assistant" else "user"
            history.append({"role": role, "parts": [conv.content]})

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        chat = model.start_chat(history=history)
        response = chat.send_message(user_message)

        assistant_text = response.text

        # Save assistant response
        asst_msg = Conversation(
            generated_paper_id=paper_id,
            user_id=user_id,
            role="assistant",
            content=assistant_text,
        )
        session.add(asst_msg)

        # Update paper if response contains marker
        if "===ANSWER_KEY===" in assistant_text:
            parts = assistant_text.split("===ANSWER_KEY===", 1)
            paper.content_markdown = _clean_paper_content(parts[0])
            paper.answer_key_markdown = _clean_paper_content(parts[1])

        session.commit()

        # Trigger learning extraction every 3rd user message
        user_msg_count = sum(1 for c in conversations if c.role == "user")
        if user_msg_count % 3 == 0 and user_msg_count > 0:
            threading.Thread(
                target=extract_learnings,
                args=(paper_id, user_id),
                daemon=True,
            ).start()

        # Return updated paper and all messages
        session.refresh(paper)
        all_convos = session.query(Conversation).filter(
            Conversation.generated_paper_id == paper_id
        ).order_by(Conversation.created_at).all()

        return paper, all_convos

    except Exception as e:
        log.error("Chat refinement failed for paper %d: %s", paper_id, e)
        session.rollback()
        raise
    finally:
        session.close()
