from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
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
    full_name: str
    password: str
    school_name: str | None = None
    role: str = "user"


class ResetPasswordRequest(BaseModel):
    new_password: str


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


@router.post("/users", response_model=UserResponse)
async def create_user(
    data: CreateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if data.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        school_name=data.school_name,
        role=data.role,
    )
    db.add(user)
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
    await db.commit()
    return {"detail": "Password reset successfully"}
