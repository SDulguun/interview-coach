"""FastAPI application for the Interview Coach."""
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .whisper_service import load_whisper_model, is_whisper_available
from .routers import analyze, jobs, questions, resume, tts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    logger.info("Starting Interview Coach API...")
    # Load Whisper in background so API is available immediately
    threading.Thread(target=load_whisper_model, daemon=True).start()
    logger.info("API ready (Whisper loading in background).")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI Interview Coach API",
    description="NLP-powered interview practice feedback for Mongolian job seekers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analyze.router)
app.include_router(jobs.router)
app.include_router(questions.router)
app.include_router(resume.router)
app.include_router(tts.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "whisper_available": is_whisper_available(),
    }
