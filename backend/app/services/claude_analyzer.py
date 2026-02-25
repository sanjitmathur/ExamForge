"""Send extracted text to Gemini for question extraction and analysis."""

import json
import logging
from google import genai
from ..config import settings

log = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are an expert education analyst. Analyze the following exam paper text and extract every question.

CRITICAL RULE — Sub-parts:
If a question has sub-parts (e.g. 1a, 1b, 1c or 1(i), 1(ii) or Q3 part A, part B), do NOT treat each sub-part as a separate question. Instead, combine ALL sub-parts into ONE question entry. The "question_text" should include the full parent question along with all its sub-parts exactly as they appear.

For each question, return a JSON object with these fields:
- "question_text": the full question text INCLUDING all sub-parts (a, b, c, i, ii, etc.) as a single combined entry
- "answer_text": the answer if provided (include answers for all sub-parts), else null
- "question_type": one of "mcq", "short_answer", "long_answer", "fill_blank", "true_false"
- "difficulty": one of "easy", "medium", "hard"
- "topic": a SHORT, broad topic label (e.g. "Magnetic Fields", "Algebra", "Thermodynamics"). IMPORTANT: Cluster related questions under the SAME topic. Do NOT create a unique topic per question. Use at most 3-5 distinct topics for the entire paper.
- "marks": total marks for the question including all sub-parts (number or null)
- "options": array of option strings for MCQs, else null
- "correct_option": correct option letter for MCQs (e.g. "A"), else null
- "bloom_level": one of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"

Example: If the paper has "Q1. (a) Define force. (b) State Newton's third law. (c) Give an example.", that is ONE question with all three parts in "question_text", NOT three separate questions.

Return ONLY a JSON array of question objects. No explanation, no markdown fences.

Paper text:
---
{text}
---"""


def analyze_paper(extracted_text: str) -> list[dict]:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = ANALYSIS_PROMPT.format(text=extracted_text[:50000])  # Limit to ~50k chars

    response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=prompt)

    response_text = response.text.strip()

    # Strip markdown fences if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        lines = lines[1:]  # remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        response_text = "\n".join(lines)

    try:
        questions = json.loads(response_text)
    except json.JSONDecodeError:
        log.error("Failed to parse Gemini response as JSON: %s", response_text[:500])
        raise RuntimeError("Gemini returned invalid JSON for question extraction")

    if not isinstance(questions, list):
        raise RuntimeError("Gemini response is not a JSON array")

    return questions
