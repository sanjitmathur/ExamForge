from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User, GeneratedPaper
from ..utils.deps import get_current_user
from ..services.export_service import markdown_to_pdf, markdown_to_docx

router = APIRouter(prefix="/api/export", tags=["export"])


async def _get_paper(paper_id: int, db: AsyncSession, user: User) -> GeneratedPaper:
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper or paper.status != "completed":
        raise HTTPException(404, "Completed paper not found")
    return paper


@router.get("/{paper_id:int}/pdf")
async def export_paper_pdf(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await _get_paper(paper_id, db, current_user)
    pdf_bytes = markdown_to_pdf(paper.content_markdown or "", paper.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{paper.title}.pdf"'},
    )


@router.get("/{paper_id:int}/word")
async def export_paper_word(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await _get_paper(paper_id, db, current_user)
    docx_bytes = markdown_to_docx(paper.content_markdown or "", paper.title)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{paper.title}.docx"'},
    )


@router.get("/{paper_id:int}/answer-key/pdf")
async def export_answer_key_pdf(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await _get_paper(paper_id, db, current_user)
    pdf_bytes = markdown_to_pdf(paper.answer_key_markdown or "", f"{paper.title} - Answer Key")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{paper.title} - Answer Key.pdf"'},
    )


@router.get("/{paper_id:int}/answer-key/word")
async def export_answer_key_word(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    paper = await _get_paper(paper_id, db, current_user)
    docx_bytes = markdown_to_docx(paper.answer_key_markdown or "", f"{paper.title} - Answer Key")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{paper.title} - Answer Key.docx"'},
    )
