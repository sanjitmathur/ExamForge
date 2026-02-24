from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from typing import Optional
from ..database import get_db
from ..models import User, ExtractedQuestion
from ..schemas import ExtractedQuestionResponse, QuestionStatsResponse
from ..utils.deps import get_current_user

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("", response_model=list[ExtractedQuestionResponse])
async def list_questions(
    board: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    question_type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    bloom_level: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(ExtractedQuestion).where(ExtractedQuestion.user_id == current_user.id)
    if board:
        q = q.where(ExtractedQuestion.board == board)
    if grade_level:
        q = q.where(ExtractedQuestion.grade_level == grade_level)
    if subject:
        q = q.where(ExtractedQuestion.subject == subject)
    if question_type:
        q = q.where(ExtractedQuestion.question_type == question_type)
    if difficulty:
        q = q.where(ExtractedQuestion.difficulty == difficulty)
    if topic:
        q = q.where(ExtractedQuestion.topic == topic)
    if bloom_level:
        q = q.where(ExtractedQuestion.bloom_level == bloom_level)

    q = q.order_by(ExtractedQuestion.id.desc())
    result = await db.execute(q)
    return [ExtractedQuestionResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/stats", response_model=QuestionStatsResponse)
async def question_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = select(ExtractedQuestion).where(ExtractedQuestion.user_id == current_user.id)

    total = await db.execute(select(func.count()).select_from(base.subquery()))
    total_count = total.scalar() or 0

    async def group_counts(column):
        result = await db.execute(
            select(column, func.count())
            .where(ExtractedQuestion.user_id == current_user.id)
            .where(column.isnot(None))
            .group_by(column)
        )
        return {str(k): v for k, v in result.all()}

    return QuestionStatsResponse(
        total_questions=total_count,
        by_type=await group_counts(ExtractedQuestion.question_type),
        by_difficulty=await group_counts(ExtractedQuestion.difficulty),
        by_subject=await group_counts(ExtractedQuestion.subject),
        by_grade=await group_counts(ExtractedQuestion.grade_level),
        by_board=await group_counts(ExtractedQuestion.board),
    )


@router.get("/topics", response_model=list[str])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(distinct(ExtractedQuestion.topic))
        .where(ExtractedQuestion.user_id == current_user.id)
        .where(ExtractedQuestion.topic.isnot(None))
        .order_by(ExtractedQuestion.topic)
    )
    return [row[0] for row in result.all()]
