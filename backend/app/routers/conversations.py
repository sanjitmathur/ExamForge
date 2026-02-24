from fastapi import APIRouter

# Chat endpoints are served via /api/generate/{id}/chat in generation.py
router = APIRouter(tags=["conversations"])
