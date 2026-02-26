import json
import threading
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..config import settings
from ..database import get_db
from ..models import User, GeneratedPaper, Conversation, UserLearning
from ..schemas import (
    GeneratePaperRequest, GeneratedPaperResponse, GeneratedPaperListResponse,
    PaperStatusResponse, ChatMessageRequest, ConversationResponse, UserLearningResponse,
)
from ..utils.deps import get_current_user
from ..services.paper_generator import generate_paper_background, refine_paper_with_chat

router = APIRouter(prefix="/api/generate", tags=["generation"])


@router.post("", response_model=GeneratedPaperResponse)
async def create_paper(
    data: GeneratePaperRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Rate limit: max papers per day
    today_start = datetime.combine(date.today(), datetime.min.time())
    count_result = await db.execute(
        select(func.count(GeneratedPaper.id)).where(
            GeneratedPaper.user_id == current_user.id,
            GeneratedPaper.created_at >= today_start,
        )
    )
    today_count = count_result.scalar() or 0
    if today_count >= settings.RATE_LIMIT_PAPERS_PER_DAY:
        raise HTTPException(
            429,
            f"Daily limit reached ({settings.RATE_LIMIT_PAPERS_PER_DAY} papers/day). Try again tomorrow.",
        )

    paper = GeneratedPaper(
        user_id=current_user.id,
        title=data.title,
        board=data.board,
        grade_level=data.grade_level,
        subject=data.subject,
        topics_json=json.dumps(data.topics) if data.topics else None,
        difficulty_mix_json=json.dumps(data.difficulty_mix) if data.difficulty_mix else None,
        total_marks=data.total_marks,
        duration_minutes=data.duration_minutes,
        status="generating",
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)

    threading.Thread(
        target=generate_paper_background,
        args=(paper.id,),
        daemon=True,
    ).start()

    return GeneratedPaperResponse.model_validate(paper)


@router.get("", response_model=list[GeneratedPaperListResponse])
async def list_papers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GeneratedPaper)
        .where(GeneratedPaper.user_id == current_user.id)
        .order_by(GeneratedPaper.created_at.desc())
    )
    return [GeneratedPaperListResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/{paper_id:int}", response_model=GeneratedPaperResponse)
async def get_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")
    return GeneratedPaperResponse.model_validate(paper)


@router.get("/{paper_id:int}/status")
async def get_paper_status(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")
    return {"id": paper.id, "status": paper.status, "error_message": paper.error_message}


@router.post("/{paper_id:int}/chat")
async def chat_with_paper(
    paper_id: int,
    data: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Paper not found")

    # Run synchronous chat in thread
    import asyncio
    loop = asyncio.get_event_loop()
    paper, conversations = await loop.run_in_executor(
        None, refine_paper_with_chat, paper_id, data.message, current_user.id
    )

    if paper is None:
        raise HTTPException(404, "Paper not found")

    return {
        "paper": GeneratedPaperResponse.model_validate(paper),
        "messages": [ConversationResponse.model_validate(c) for c in conversations],
    }


@router.delete("/{paper_id:int}")
async def delete_paper(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == current_user.id,
        )
    )
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(404, "Paper not found")
    await db.delete(paper)
    await db.commit()
    return {"detail": "Paper deleted"}


@router.get("/{paper_id:int}/chat", response_model=list[ConversationResponse])
async def get_chat_history(
    paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    result = await db.execute(
        select(GeneratedPaper).where(
            GeneratedPaper.id == paper_id,
            GeneratedPaper.user_id == current_user.id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Paper not found")

    result = await db.execute(
        select(Conversation)
        .where(Conversation.generated_paper_id == paper_id)
        .order_by(Conversation.created_at)
    )
    return [ConversationResponse.model_validate(c) for c in result.scalars().all()]


# ── Learnings ──────────────────────────────────────────────────────────────

@router.get("/learnings", response_model=list[UserLearningResponse])
async def list_learnings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserLearning)
        .where(UserLearning.user_id == current_user.id, UserLearning.is_active == True)
        .order_by(UserLearning.created_at.desc())
    )
    return [UserLearningResponse.model_validate(l) for l in result.scalars().all()]


@router.delete("/learnings/{learning_id:int}")
async def delete_learning(
    learning_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserLearning).where(
            UserLearning.id == learning_id,
            UserLearning.user_id == current_user.id,
        )
    )
    learning = result.scalar_one_or_none()
    if not learning:
        raise HTTPException(404, "Learning not found")
    await db.delete(learning)
    await db.commit()
    return {"detail": "Learning deleted"}
