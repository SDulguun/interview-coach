"""Whisper speech-to-text service (faster-whisper backend)."""
import logging
import re

from .config import WHISPER_MODEL, WHISPER_INITIAL_PROMPT

logger = logging.getLogger(__name__)

_model = None


def load_whisper_model():
    """Load the faster-whisper model. Called once at startup."""
    global _model
    try:
        from faster_whisper import WhisperModel

        logger.info(f"Loading faster-whisper model: {WHISPER_MODEL}")
        _model = WhisperModel(
            WHISPER_MODEL,
            device="cpu",
            compute_type="auto",
        )
        logger.info("Faster-whisper model loaded successfully")
    except ImportError:
        logger.warning(
            "faster-whisper not installed. Audio transcription unavailable. "
            "Install with: pip install faster-whisper"
        )
    except Exception as e:
        logger.warning(f"Failed to load Whisper model: {e}")


def transcribe_audio(audio_path: str) -> str:
    """Transcribe an audio file using faster-whisper."""
    if _model is None:
        raise RuntimeError(
            "Whisper model not loaded. Install faster-whisper and ffmpeg."
        )

    segments, info = _model.transcribe(
        audio_path,
        language="mn",
        beam_size=5,
        temperature=0.0,
        condition_on_previous_text=False,
        initial_prompt=WHISPER_INITIAL_PROMPT,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    text = " ".join(segment.text.strip() for segment in segments)
    text = _post_process(text)
    logger.info(
        f"Transcription complete: language={info.language}, "
        f"probability={info.language_probability:.2f}, "
        f"duration={info.duration:.1f}s"
    )
    return text


def _post_process(text: str) -> str:
    """Add punctuation and capitalization to raw transcription."""
    text = text.strip()
    if not text:
        return text

    # Split on existing sentence-ending punctuation to preserve any the model got right
    # Then handle chunks that have no punctuation (long unpunctuated runs)
    sentences = re.split(r'(?<=[.!?])\s+', text)

    result = []
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        # Capitalize first letter
        sentence = sentence[0].upper() + sentence[1:]
        # Add period if sentence doesn't already end with punctuation
        if sentence[-1] not in '.!?':
            sentence += '.'
        result.append(sentence)

    return ' '.join(result)


def is_whisper_available() -> bool:
    """Check if Whisper is loaded and ready."""
    return _model is not None
