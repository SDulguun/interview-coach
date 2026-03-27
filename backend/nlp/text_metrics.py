"""Basic text metrics for interview response analysis."""
import re


def count_words(text: str) -> int:
    if not isinstance(text, str) or not text.strip():
        return 0
    return len(text.split())


def count_sentences(text: str) -> int:
    if not isinstance(text, str) or not text.strip():
        return 0
    return max(len(re.findall(r'[.?!]+', text)), 1)


def compute_ttr(text: str) -> float:
    """Type-Token Ratio: unique words / total words."""
    if not isinstance(text, str) or not text.strip():
        return 0.0
    words = text.lower().split()
    if len(words) == 0:
        return 0.0
    return round(len(set(words)) / len(words), 4)


def avg_word_length(text: str) -> float:
    if not isinstance(text, str) or not text.strip():
        return 0.0
    words = text.split()
    if len(words) == 0:
        return 0.0
    return round(sum(len(w) for w in words) / len(words), 2)


def compute_all_metrics(text: str) -> dict:
    """Compute all text metrics at once."""
    return {
        "word_count": count_words(text),
        "sentence_count": count_sentences(text),
        "ttr": compute_ttr(text),
        "avg_word_length": avg_word_length(text),
    }
