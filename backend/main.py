"""FastAPI application for the Interview Coach."""
import logging
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .whisper_service import load_whisper_model, is_whisper_available
from .nlp.coreml_embeddings import load_embedding_model, is_embedding_model_available
from .routers import analyze, feedback, jobs, questions, reaction, resume, tts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DISABLE_WHISPER = os.environ.get("DISABLE_WHISPER", "").strip().lower() in ("1", "true", "yes")
DISABLE_COREML = os.environ.get("DISABLE_COREML", "").strip().lower() in ("1", "true", "yes")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    logger.info("Starting Interview Coach API...")
    if DISABLE_WHISPER:
        logger.info("Whisper STT disabled via DISABLE_WHISPER env var.")
    else:
        threading.Thread(target=load_whisper_model, daemon=True).start()
    if DISABLE_COREML:
        logger.info("Core ML embeddings disabled via DISABLE_COREML env var (TF-IDF fallback).")
    else:
        threading.Thread(target=load_embedding_model, daemon=True).start()
    logger.info("API ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI Interview Coach API",
    description="NLP-powered interview practice feedback for Mongolian job seekers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — defaults to localhost dev; production passes CORS_ORIGINS (comma-separated)
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://localhost:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register routers
app.include_router(analyze.router)
app.include_router(feedback.router)
app.include_router(jobs.router)
app.include_router(questions.router)
app.include_router(reaction.router)
app.include_router(resume.router)
app.include_router(tts.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "whisper_available": is_whisper_available(),
        "coreml_available": is_embedding_model_available(),
    }
