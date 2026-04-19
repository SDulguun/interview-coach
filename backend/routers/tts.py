"""Text-to-Speech endpoint using edge-tts for dynamic audio generation."""
import hashlib
import os
import tempfile
import logging

import edge_tts
from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tts", tags=["tts"])

VOICE = "mn-MN-YesuiNeural"
CACHE_DIR = os.path.join(tempfile.gettempdir(), "interview-coach-tts")
os.makedirs(CACHE_DIR, exist_ok=True)


class TTSRequest(BaseModel):
    text: str
    voice: str = VOICE


@router.post("/generate")
async def generate_tts(req: TTSRequest):
    """Generate TTS audio for given text. Returns audio/mpeg file.

    Caches generated audio by text hash to avoid re-generation.
    """
    text = req.text.strip()
    if not text:
        return {"error": "No text provided"}

    # Check cache (include voice in hash to avoid collisions)
    cache_key = f"{req.voice}:{text}"
    text_hash = hashlib.md5(cache_key.encode()).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{text_hash}.mp3")

    if not os.path.exists(cache_path):
        try:
            communicate = edge_tts.Communicate(text, req.voice, rate="-10%")
            await communicate.save(cache_path)
            logger.info(f"Generated TTS audio: {text[:50]}...")
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return {"error": "TTS generation failed"}

    return FileResponse(
        cache_path,
        media_type="audio/mpeg",
        filename="question.mp3",
    )
