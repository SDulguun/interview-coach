"""LLM-generated one-sentence interviewer reactions tailored to each answer.

Activated when ANTHROPIC_API_KEY is set. Returns None on any failure so the
caller can fall back to a fixed safe sentence.

Uses prompt caching on the system prompt — it's identical across an entire
session, so cache hits start at the second question and cover the whole flow.
"""
from __future__ import annotations

import logging
from typing import Optional

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL

log = logging.getLogger(__name__)

_client = None
_client_init_failed = False


def is_enabled() -> bool:
    return bool(ANTHROPIC_API_KEY)


def _get_client():
    global _client, _client_init_failed
    if _client is not None or _client_init_failed:
        return _client
    if not ANTHROPIC_API_KEY:
        return None
    try:
        from anthropic import Anthropic
        _client = Anthropic(api_key=ANTHROPIC_API_KEY)
    except Exception as e:
        log.warning("anthropic client init failed: %s", e)
        _client_init_failed = True
        _client = None
    return _client


_SYSTEM_MN = """Та халуун дотно, мэргэжлийн ярилцлага авагч байна.
Нэр дэвшигчийн хариултыг сонссоны дараа ЗӨВХӨН НЭГ богино өгүүлбэрээр (≤18 үг) хариулна.
- Хариултын онцлог зүйлийг (тоо, нэр, дүр төрх) ишлэх замаар тухайн хариултад тохируулсан байх.
- Үнэлгээ өгөхгүй, оноо тавихгүй, шүүмжлэл хийхгүй.
- Та/Таны/тань хүндэтгэлийн хэлбэр заавал ашиглана. Чи/чинь/чамайг ХЭРЭГЛЭХГҮЙ.
- Нэмэлт асуулт асуухгүй (тусгайлан зөвшөөрөөгүй бол).
- Зөвхөн өгүүлбэрээ буцаа — тайлбар, ишлэл, тэмдэгт нэмэхгүй."""

_SYSTEM_EN = """You are a warm, professional interviewer.
After hearing the candidate's answer, respond with EXACTLY ONE short sentence (≤18 words).
- Reference something specific from their answer (a number, name, role, detail) so it feels tailored, not generic.
- No evaluation, scoring, or critique.
- Do not ask a follow-up question unless explicitly told to.
- Reply with only the sentence — no quotes, prefix, or commentary."""

_CLOSING_MN = "Энэ бол ярилцлагын ТӨГСГӨЛ. Дулаахан, нэг өгүүлбэртэй, баяртай гэсэн төгсгөлийн хариу өгнө үү."
_CLOSING_EN = "This is the LAST question. Give a warm one-sentence closing thank-you."


def _user_prompt(question: str, answer: str, lang: str, difficulty: str,
                 is_last: bool, job_title: str) -> str:
    parts = [f"QUESTION: {question}", f"CANDIDATE_ANSWER: {answer}"]
    if job_title:
        parts.append(f"ROLE: {job_title}")
    parts.append(f"DIFFICULTY: {difficulty}")
    if is_last:
        parts.append(_CLOSING_MN if lang == "mn" else _CLOSING_EN)
    return "\n".join(parts)


def _clean(text: str) -> str:
    s = (text or "").strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    # Keep only the first line — model occasionally adds extra newlines.
    s = s.split("\n", 1)[0].strip()
    return s


def generate(*, question: str, answer: str, lang: str, difficulty: str,
             is_last: bool, job_title: str = "") -> Optional[str]:
    """Return a one-sentence reaction string, or None if generation failed."""
    client = _get_client()
    if client is None:
        return None

    system_text = _SYSTEM_MN if lang == "mn" else _SYSTEM_EN
    user_text = _user_prompt(question, answer, lang, difficulty, is_last, job_title)

    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=120,
            temperature=0.7,
            system=[
                {
                    "type": "text",
                    "text": system_text,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_text}],
        )
        raw = "".join(b.text for b in msg.content if hasattr(b, "text"))
    except Exception as e:
        log.warning("reaction LLM call failed: %s", e)
        return None

    cleaned = _clean(raw)
    if not cleaned or len(cleaned) > 280:
        return None
    return cleaned
