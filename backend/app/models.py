from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    school_name = Column(String(255), nullable=True)
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    uploaded_papers = relationship("UploadedPaper", back_populates="user", cascade="all, delete-orphan")
    generated_papers = relationship("GeneratedPaper", back_populates="user", cascade="all, delete-orphan")


class UploadedPaper(Base):
    __tablename__ = "uploaded_papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)  # UUID filename on disk
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, docx, jpg, png
    board = Column(String(50), nullable=True)
    status = Column(String(20), default="pending")  # pending -> extracting -> analyzing -> completed/failed
    extracted_text = Column(Text, nullable=True)
    grade_level = Column(String(50), nullable=True)
    subject = Column(String(100), nullable=True)
    topics_json = Column(Text, nullable=True)  # JSON array of topic strings
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="uploaded_papers")
    questions = relationship("ExtractedQuestion", back_populates="paper", cascade="all, delete-orphan")


class ExtractedQuestion(Base):
    __tablename__ = "extracted_questions"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("uploaded_papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # denormalized for fast filtering
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    question_type = Column(String(20), nullable=False)  # mcq, short_answer, long_answer, fill_blank, true_false
    difficulty = Column(String(10), nullable=False)  # easy, medium, hard
    board = Column(String(50), nullable=True)
    grade_level = Column(String(50), nullable=True)
    subject = Column(String(100), nullable=True)
    topic = Column(String(200), nullable=True)
    marks = Column(Float, nullable=True)
    options_json = Column(Text, nullable=True)  # JSON array for MCQ options
    correct_option = Column(String(10), nullable=True)
    bloom_level = Column(String(30), nullable=True)
    order_in_paper = Column(Integer, nullable=False, default=0)

    paper = relationship("UploadedPaper", back_populates="questions")


class GeneratedPaper(Base):
    __tablename__ = "generated_papers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    status = Column(String(20), default="generating")  # generating, completed, failed
    board = Column(String(50), nullable=True)
    grade_level = Column(String(50), nullable=True)
    subject = Column(String(100), nullable=True)
    topics_json = Column(Text, nullable=True)
    difficulty_mix_json = Column(Text, nullable=True)
    total_marks = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    content_markdown = Column(Text, nullable=True)
    answer_key_markdown = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="generated_papers")
    conversations = relationship("Conversation", back_populates="generated_paper", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    generated_paper_id = Column(Integer, ForeignKey("generated_papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(10), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    generated_paper = relationship("GeneratedPaper", back_populates="conversations")
