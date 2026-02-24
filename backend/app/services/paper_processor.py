"""Background thread processor: extract text -> analyze with Claude -> save questions."""

import json
import logging
import traceback
from pathlib import Path
from ..database import SyncSessionLocal
from ..models import UploadedPaper, ExtractedQuestion
from .text_extractor import extract_text
from .claude_analyzer import analyze_paper

log = logging.getLogger(__name__)


def process_paper_background(paper_id: int, file_path: Path, file_type: str):
    """Run in a background thread. Updates paper status and saves extracted questions."""
    session = SyncSessionLocal()
    try:
        paper = session.get(UploadedPaper, paper_id)
        if not paper:
            return

        # Step 1: Extract text
        paper.status = "extracting"
        session.commit()

        extracted = extract_text(file_path, file_type)
        paper.extracted_text = extracted

        if not extracted.strip():
            paper.status = "failed"
            paper.error_message = "No text could be extracted from the file"
            session.commit()
            return

        # Step 2: Analyze with Claude
        paper.status = "analyzing"
        session.commit()

        questions_data = analyze_paper(extracted)

        # Step 3: Save questions
        topics = set()
        for idx, q in enumerate(questions_data):
            eq = ExtractedQuestion(
                paper_id=paper.id,
                user_id=paper.user_id,
                question_text=q.get("question_text", ""),
                answer_text=q.get("answer_text"),
                question_type=q.get("question_type", "short_answer"),
                difficulty=q.get("difficulty", "medium"),
                board=paper.board,
                grade_level=paper.grade_level,
                subject=paper.subject,
                topic=q.get("topic"),
                marks=q.get("marks"),
                options_json=json.dumps(q["options"]) if q.get("options") else None,
                correct_option=q.get("correct_option"),
                bloom_level=q.get("bloom_level"),
                order_in_paper=idx + 1,
            )
            session.add(eq)
            if q.get("topic"):
                topics.add(q["topic"])

        paper.topics_json = json.dumps(sorted(topics)) if topics else None
        paper.status = "completed"
        session.commit()
        log.info("Paper %d processed: %d questions extracted", paper_id, len(questions_data))

    except Exception as e:
        log.error("Paper %d processing failed: %s\n%s", paper_id, e, traceback.format_exc())
        try:
            paper = session.get(UploadedPaper, paper_id)
            if paper:
                paper.status = "failed"
                paper.error_message = str(e)[:500]
                session.commit()
        except Exception:
            session.rollback()
    finally:
        session.close()
