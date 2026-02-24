"""Send extracted text to Claude for question extraction and analysis."""

import json
import logging
from anthropic import Anthropic
from ..config import settings

log = logging.getLogger(__name__)

ANALYSIS_PROMPT = """You are an expert education analyst. Analyze the following exam paper text and extract every question.

For each question, return a JSON object with these fields:
- "question_text": the full question text
- "answer_text": the answer if provided, else null
- "question_type": one of "mcq", "short_answer", "long_answer", "fill_blank", "true_false"
- "difficulty": one of "easy", "medium", "hard"
- "topic": the subject topic this question covers
- "marks": marks allocated (number or null)
- "options": array of option strings for MCQs, else null
- "correct_option": correct option letter for MCQs (e.g. "A"), else null
- "bloom_level": one of "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"

Return ONLY a JSON array of question objects. No explanation, no markdown fences.

Paper text:
---
{text}
---"""


def analyze_paper(extracted_text: str) -> list[dict]:
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")

    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = ANALYSIS_PROMPT.format(text=extracted_text[:50000])  # Limit to ~50k chars

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text.strip()

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
        log.error("Failed to parse Claude response as JSON: %s", response_text[:500])
        raise RuntimeError("Claude returned invalid JSON for question extraction")

    if not isinstance(questions, list):
        raise RuntimeError("Claude response is not a JSON array")

    return questions
