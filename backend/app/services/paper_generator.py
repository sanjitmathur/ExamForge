"""Generate exam papers using Claude AI with questions from the user's bank as context."""

import json
import logging
import traceback
from ..database import SyncSessionLocal
from ..models import GeneratedPaper, ExtractedQuestion, Conversation
from ..config import settings
from anthropic import Anthropic

log = logging.getLogger(__name__)

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

Generate TWO sections in your response, separated by the exact marker "===ANSWER_KEY===":

1. FIRST: The complete exam paper in Markdown format with:
   - Paper header (title, board, grade, subject, marks, duration)
   - Clear instructions for students
   - Numbered questions organized by sections
   - Marks indicated for each question

2. AFTER the marker "===ANSWER_KEY===": The complete answer key in Markdown with answers for every question.

Output the paper now:"""


def generate_paper_background(paper_id: int):
    """Run in a background thread. Generates paper content using Claude."""
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

        topics = json.loads(paper.topics_json) if paper.topics_json else ["General"]
        difficulty_mix = json.loads(paper.difficulty_mix_json) if paper.difficulty_mix_json else {"easy": 3, "medium": 4, "hard": 3}

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
            additional_instructions=f"Additional instructions: {json.loads(paper.difficulty_mix_json).get('instructions', '')}" if False else "",
            question_bank=question_bank[:20000],
        )

        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text

        if "===ANSWER_KEY===" in response_text:
            parts = response_text.split("===ANSWER_KEY===", 1)
            paper.content_markdown = parts[0].strip()
            paper.answer_key_markdown = parts[1].strip()
        else:
            paper.content_markdown = response_text
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
    """Send conversation history + current paper to Claude for refinement."""
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

        # Build conversation history
        conversations = session.query(Conversation).filter(
            Conversation.generated_paper_id == paper_id
        ).order_by(Conversation.created_at).all()

        messages = []
        # System context about current paper
        system_context = (
            f"You are helping refine an exam paper. The current paper content is:\n\n"
            f"---PAPER---\n{paper.content_markdown}\n---END PAPER---\n\n"
            f"---ANSWER KEY---\n{paper.answer_key_markdown}\n---END ANSWER KEY---\n\n"
            f"When the user asks for changes, output the COMPLETE updated paper and answer key "
            f"separated by the marker '===ANSWER_KEY==='. If the user is just asking a question "
            f"(not requesting changes), respond normally without the marker."
        )

        messages.append({"role": "user", "content": system_context})
        messages.append({"role": "assistant", "content": "I understand. I have the current exam paper and answer key. What changes would you like me to make?"})

        for conv in conversations:
            messages.append({"role": conv.role, "content": conv.content})

        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=8192,
            messages=messages,
        )

        assistant_text = response.content[0].text

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
            paper.content_markdown = parts[0].strip()
            paper.answer_key_markdown = parts[1].strip()

        session.commit()

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
