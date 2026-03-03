import asyncio
import urllib.request
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import auth, admin, papers, questions, generation, conversations, export


async def _keep_alive():
    """Ping own public URL every 13 min to prevent Render free-tier spin-down."""
    while True:
        await asyncio.sleep(13 * 60)
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, urllib.request.urlopen, settings.KEEP_ALIVE_URL)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    task = None
    if settings.KEEP_ALIVE_URL:
        task = asyncio.create_task(_keep_alive())
    yield
    if task:
        task.cancel()


app = FastAPI(title="ExamForge API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(papers.router)
app.include_router(questions.router)
app.include_router(generation.router)
app.include_router(conversations.router)
app.include_router(export.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "3"}
