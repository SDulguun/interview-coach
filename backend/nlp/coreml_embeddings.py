"""Core ML sentence embedding service for semantic similarity scoring.

Loads a converted multilingual-MiniLM model (.mlpackage) and provides
sentence embeddings for Mongolian + English text. Follows the same
singleton pattern as whisper_service.py.
"""
import logging
import numpy as np

from ..config import COREML_MODEL_PATH, COREML_TOKENIZER, COREML_SEQ_LENGTH

logger = logging.getLogger(__name__)

_model = None
_tokenizer = None


def load_embedding_model():
    """Load the Core ML embedding model and tokenizer. Called once at startup."""
    global _model, _tokenizer
    try:
        import coremltools as ct
        from transformers import AutoTokenizer

        logger.info(f"Loading Core ML embedding model: {COREML_MODEL_PATH}")
        _model = ct.models.MLModel(COREML_MODEL_PATH)
        _tokenizer = AutoTokenizer.from_pretrained(COREML_TOKENIZER)
        logger.info("Core ML embedding model loaded successfully")
    except ImportError as e:
        logger.warning(
            f"Required package not installed for Core ML embeddings: {e}. "
            "Install with: pip install coremltools transformers"
        )
    except Exception as e:
        logger.warning(f"Failed to load Core ML embedding model: {e}")


def is_embedding_model_available() -> bool:
    """Check if the Core ML embedding model is loaded and ready."""
    return _model is not None and _tokenizer is not None


def get_embedding(text: str) -> np.ndarray:
    """Compute a 384-dim sentence embedding for the given text.

    Returns:
        np.ndarray of shape (384,), L2-normalized.

    Raises:
        RuntimeError: If the model is not loaded.
    """
    if not is_embedding_model_available():
        raise RuntimeError("Core ML embedding model not loaded.")

    encoded = _tokenizer(
        text,
        max_length=COREML_SEQ_LENGTH,
        padding="max_length",
        truncation=True,
        return_tensors="np",
    )

    prediction = _model.predict({
        "input_ids": encoded["input_ids"].astype(np.int32),
    })

    # Extract embedding from prediction output
    output_key = list(prediction.keys())[0]
    embedding = np.array(prediction[output_key]).flatten()[:384]
    return embedding


def compute_semantic_similarity(text_a: str, text_b: str) -> float:
    """Compute cosine similarity between two texts using Core ML embeddings.

    Returns:
        float between -1.0 and 1.0 (typically 0.0 to 1.0 for related texts).
    """
    emb_a = get_embedding(text_a)
    emb_b = get_embedding(text_b)

    dot = np.dot(emb_a, emb_b)
    norm_a = np.linalg.norm(emb_a)
    norm_b = np.linalg.norm(emb_b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(dot / (norm_a * norm_b))
