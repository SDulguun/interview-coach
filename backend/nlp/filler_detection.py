"""Filler word detection for Mongolian and English."""

MONGOLIAN_FILLERS = [
    'тэгээд',      # "and then" (filler connector)
    'тиймээ',      # "yeah/right" (verbal nod)
    'гэхдээ',      # "but/however" (hedging)
    'яг',          # "exactly/like" (emphasis filler)
    'тийм',        # "yes/right" (agreement filler)
    'болохоор',     # "because/so" (vague connector)
    'харин',        # "but/on the other hand"
    'нөгөө',       # "that thing" (vague reference)
    'тэгэхээр',    # "so then" (filler connector)
    'мэдэхгүй',    # "I don't know" (uncertainty)
]

ENGLISH_FILLERS = [
    'um', 'uh', 'like', 'you know', 'basically', 'actually',
    'literally', 'sort of', 'kind of', 'i mean', 'right',
    'well', 'so', 'anyway',
]

PUNCTUATION = '.,!?;:'


def detect_fillers(text: str) -> dict:
    """Detect filler words in text. Returns counts and positions."""
    if not isinstance(text, str) or not text.strip():
        return {"total_count": 0, "mongolian": [], "english": [], "details": []}

    words = text.lower().split()
    cleaned_words = [w.strip(PUNCTUATION) for w in words]
    text_lower = text.lower()

    mn_found = []
    en_found = []
    details = []

    # Check Mongolian fillers
    for filler in MONGOLIAN_FILLERS:
        for i, w in enumerate(cleaned_words):
            if w == filler:
                mn_found.append(filler)
                details.append({"word": filler, "language": "mn", "position": i})

    # Check English fillers (including multi-word)
    for filler in ENGLISH_FILLERS:
        if ' ' in filler:
            count = text_lower.count(filler)
            for _ in range(count):
                en_found.append(filler)
                details.append({"word": filler, "language": "en", "position": -1})
        else:
            for i, w in enumerate(cleaned_words):
                if w == filler:
                    en_found.append(filler)
                    details.append({"word": filler, "language": "en", "position": i})

    return {
        "total_count": len(mn_found) + len(en_found),
        "mongolian": mn_found,
        "english": en_found,
        "details": details,
    }
