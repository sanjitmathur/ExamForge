from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    school_name: Optional[str] = None


class UserLogin(BaseModel):
    identifier: str  # email or username
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    school_name: Optional[str]
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    school_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Uploaded Papers ──
class UploadedPaperResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    board: Optional[str]
    status: str
    grade_level: Optional[str]
    subject: Optional[str]
    topics_json: Optional[str]
    error_message: Optional[str]
    question_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PaperStatusResponse(BaseModel):
    id: int
    status: str
    error_message: Optional[str]
    question_count: int = 0


# ── Extracted Questions ──
class ExtractedQuestionResponse(BaseModel):
    id: int
    paper_id: int
    question_text: str
    answer_text: Optional[str]
    question_type: str
    difficulty: str
    board: Optional[str]
    grade_level: Optional[str]
    subject: Optional[str]
    topic: Optional[str]
    marks: Optional[float]
    options_json: Optional[str]
    correct_option: Optional[str]
    bloom_level: Optional[str]
    order_in_paper: int

    class Config:
        from_attributes = True


class QuestionStatsResponse(BaseModel):
    total_questions: int
    by_type: dict
    by_difficulty: dict
    by_subject: dict
    by_grade: dict
    by_board: dict


# ── Generated Papers ──
class GeneratePaperRequest(BaseModel):
    title: str
    board: str
    grade_level: str
    subject: str
    topics: list[str] = []
    question_types: list[str] = []
    difficulty_mix: dict[str, int] = {}
    total_marks: Optional[float] = None
    duration_minutes: Optional[int] = None
    additional_instructions: Optional[str] = None


class GeneratedPaperResponse(BaseModel):
    id: int
    title: str
    status: str
    board: Optional[str]
    grade_level: Optional[str]
    subject: Optional[str]
    topics_json: Optional[str]
    difficulty_mix_json: Optional[str]
    total_marks: Optional[float]
    duration_minutes: Optional[int]
    content_markdown: Optional[str]
    answer_key_markdown: Optional[str]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class GeneratedPaperListResponse(BaseModel):
    id: int
    title: str
    status: str
    board: Optional[str]
    grade_level: Optional[str]
    subject: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Conversations ──
class UserLearningResponse(BaseModel):
    id: int
    category: str
    learning: str
    source_paper_id: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    message: str


class ConversationResponse(BaseModel):
    id: int
    generated_paper_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
