from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..models import User, UploadedPaper, ExtractedQuestion, GeneratedPaper
from ..schemas import UserResponse
from ..utils.auth import hash_password
from ..utils.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminStats(BaseModel):
    total_users: int
    total_admins: int
    total_papers_uploaded: int
    total_questions: int
    total_papers_generated: int
    recent_users: list[UserResponse]


class CreateUserRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    school_name: str | None = None
    role: str = "user"


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    username: str | None = None
    school_name: str | None = None
    role: str | None = None


class ResetPasswordRequest(BaseModel):
    new_password: str


# ── User detail response models ──

class UserPaperItem(BaseModel):
    id: int
    original_filename: str
    board: Optional[str]
    grade_level: Optional[str]
    subject: Optional[str]
    status: str
    question_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserGeneratedItem(BaseModel):
    id: int
    title: str
    board: Optional[str]
    grade_level: Optional[str]
    subject: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    school_name: Optional[str]
    role: str
    plain_password: Optional[str]
    created_at: datetime
    papers_uploaded: int
    questions_extracted: int
    papers_generated: int
    uploaded_papers: list[UserPaperItem]
    generated_papers: list[UserGeneratedItem]

    class Config:
        from_attributes = True


@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_admins = (await db.execute(
        select(func.count(User.id)).where(User.role == "admin")
    )).scalar() or 0
    total_papers_uploaded = (await db.execute(select(func.count(UploadedPaper.id)))).scalar() or 0
    total_questions = (await db.execute(select(func.count(ExtractedQuestion.id)))).scalar() or 0
    total_papers_generated = (await db.execute(select(func.count(GeneratedPaper.id)))).scalar() or 0

    recent_result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(5)
    )
    recent_users = [UserResponse.model_validate(u) for u in recent_result.scalars().all()]

    return AdminStats(
        total_users=total_users,
        total_admins=total_admins,
        total_papers_uploaded=total_papers_uploaded,
        total_questions=total_questions,
        total_papers_generated=total_papers_generated,
        recent_users=recent_users,
    )


@router.get("/user-detail/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Counts
    papers_uploaded = (await db.execute(
        select(func.count(UploadedPaper.id)).where(UploadedPaper.user_id == user_id)
    )).scalar() or 0
    questions_extracted = (await db.execute(
        select(func.count(ExtractedQuestion.id)).where(ExtractedQuestion.user_id == user_id)
    )).scalar() or 0
    papers_generated = (await db.execute(
        select(func.count(GeneratedPaper.id)).where(GeneratedPaper.user_id == user_id)
    )).scalar() or 0

    # Uploaded papers with question counts
    papers_result = await db.execute(
        select(UploadedPaper).where(UploadedPaper.user_id == user_id).order_by(UploadedPaper.created_at.desc())
    )
    uploaded_papers_raw = papers_result.scalars().all()
    uploaded_papers = []
    for p in uploaded_papers_raw:
        qcount = (await db.execute(
            select(func.count(ExtractedQuestion.id)).where(ExtractedQuestion.paper_id == p.id)
        )).scalar() or 0
        uploaded_papers.append(UserPaperItem(
            id=p.id,
            original_filename=p.original_filename,
            board=p.board,
            grade_level=p.grade_level,
            subject=p.subject,
            status=p.status,
            question_count=qcount,
            created_at=p.created_at,
        ))

    # Generated papers
    gen_result = await db.execute(
        select(GeneratedPaper).where(GeneratedPaper.user_id == user_id).order_by(GeneratedPaper.created_at.desc())
    )
    generated_papers = [UserGeneratedItem.model_validate(g) for g in gen_result.scalars().all()]

    return UserDetailResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        school_name=user.school_name,
        role=user.role,
        plain_password=user.plain_password,
        created_at=user.created_at,
        papers_uploaded=papers_uploaded,
        questions_extracted=questions_extracted,
        papers_generated=papers_generated,
        uploaded_papers=uploaded_papers,
        generated_papers=generated_papers,
    )


@router.post("/users", response_model=UserResponse)
async def create_user(
    data: CreateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    if data.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        plain_password=data.password,
        full_name=data.full_name,
        school_name=data.school_name,
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UpdateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email is not None and data.email != user.email:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = data.email
    if data.username is not None and data.username != user.username:
        existing = await db.execute(select(User).where(User.username == data.username))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = data.username
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.school_name is not None:
        user.school_name = data.school_name
    if data.role is not None:
        if data.role not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
        user.role = data.role

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted successfully"}


@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    data: ResetPasswordRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    user.plain_password = data.new_password
    await db.commit()
    return {"detail": "Password reset successfully"}
