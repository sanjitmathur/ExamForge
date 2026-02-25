import uuid
import threading
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..database import get_db
from ..models import User, UploadedPaper, ExtractedQuestion
from ..schemas import UploadedPaperResponse, PaperStatusResponse
from ..utils.deps import get_current_user
from ..config import settings
from ..services.paper_processor import process_paper_background

router = APIRouter(prefix="/api/papers", tags=["papers"])

ALLOWED_TYPES = {"pdf", "docx", "jpg", "jpeg", "png"}


@router.post("/upload", response_model=UploadedPaperResponse)
async def upload_paper(
    file: UploadFile = File(...),
    board: str = Form(...),
    grade_level: str = Form(...),
    subject: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type '.{ext}' not supported. Use PDF, DOCX, JPG, or PNG.")

    # Check file size
    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    # Save to disk
    disk_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = settings.UPLOAD_DIR / disk_name
    file_path.write_bytes(contents)

    paper = UploadedPaper(
        user_id=current_user.id,
        filename=disk_name,
        original_filename=file.filename or "unknown",
        file_type=ext,
        board=board,
        grade_level=grade_level,
        subject=subject,
        status="pending",
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)

    # Start background processing
    threading.Thread(
        target=process_paper_background,
        args=(paper.id, file_path, ext),
        daemon=True,
    ).start()

    resp = UploadedPaperResponse.model_validate(paper)
    resp.question_count = 0
    return resp


@router.get("", response_model=list[UploadedPaperResponse])
async def list_papers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedPaper)
        .where(UploadedPaper.user_id == current_user.id)
        .order_by(UploadedPaper.created_at.desc())
    )
    papers = result.scalars().all()

    # Get question counts
    counts_result = await db.execute(
        select(ExtractedQuestion.paper_id, func.count(ExtractedQuestion.id))
        .where(ExtractedQuestion.user_id == current_user.id)
        .group_by(ExtractedQuestion.paper_id)
    )
    counts = dict(counts_result.all())

    responses = []
    for p in papers:
        resp = UploadedPaperResponse.model_validate(p)
        resp.question_count = counts.get(p.id, 0)
        responses.append(resp)
    return responses


@router.get("/{paper_id:int}", response_model=UploadedPaperResponse)
async def get_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedPaper).where(
            UploadedPaper.id == paper_id,
            UploadedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")

    count_result = await db.execute(
        select(func.count(ExtractedQuestion.id)).where(ExtractedQuestion.paper_id == paper_id)
    )
    resp = UploadedPaperResponse.model_validate(paper)
    resp.question_count = count_result.scalar() or 0
    return resp


@router.get("/{paper_id:int}/status", response_model=PaperStatusResponse)
async def get_paper_status(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedPaper).where(
            UploadedPaper.id == paper_id,
            UploadedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")

    count_result = await db.execute(
        select(func.count(ExtractedQuestion.id)).where(ExtractedQuestion.paper_id == paper_id)
    )

    return PaperStatusResponse(
        id=paper.id,
        status=paper.status,
        error_message=paper.error_message,
        question_count=count_result.scalar() or 0,
    )


@router.post("/{paper_id:int}/retry", response_model=PaperStatusResponse)
async def retry_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedPaper).where(
            UploadedPaper.id == paper_id,
            UploadedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")
    if paper.status != "failed":
        raise HTTPException(400, "Only failed papers can be retried")

    paper.status = "pending"
    paper.error_message = None
    await db.commit()
    await db.refresh(paper)

    file_path = settings.UPLOAD_DIR / paper.filename
    if not file_path.exists():
        raise HTTPException(400, "Original file no longer exists. Please re-upload.")

    threading.Thread(
        target=process_paper_background,
        args=(paper.id, file_path, paper.file_type),
        daemon=True,
    ).start()

    return PaperStatusResponse(
        id=paper.id,
        status=paper.status,
        error_message=None,
        question_count=0,
    )


@router.delete("/{paper_id:int}")
async def delete_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UploadedPaper).where(
            UploadedPaper.id == paper_id,
            UploadedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")

    # Delete file from disk
    file_path = settings.UPLOAD_DIR / paper.filename
    if file_path.exists():
        file_path.unlink()

    await db.delete(paper)
    await db.commit()
    return {"detail": "Paper deleted"}
