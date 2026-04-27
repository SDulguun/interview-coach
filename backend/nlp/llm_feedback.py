"""LLM-backed sample answers and improvement suggestions.

Activated when ANTHROPIC_API_KEY is set in the environment. Falls back to
rule-based templates when the key is missing or any call/validation fails.

Belt-and-suspenders: every LLM result is run through a contradiction guard
and a Jaccard similarity check before being returned, so a poor model
output cannot poison the breakdown UI.
"""
from __future__ import annotations

import json
import logging
import re
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


_WORD_RE = re.compile(r"[\w'’]+", re.UNICODE)


def _tokens(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text or "") if len(w) > 2}


def _overlap(a: str, b: str) -> float:
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(1, len(ta | tb))


# Topic keywords that, if present in BOTH a strength and an improvement,
# indicate a self-contradicting feedback set.
_AXES = [
    {"filler", "дүүргэгч", "пауз", "pause"},
    {"star", "бүтэц", "structure", "result", "үр дүн"},
    {"тоо", "number", "metric", "хэмжигдэхүйц", "хувь"},
    {"үйл үг", "verb", "action"},
    {"товч", "урт", "brief", "long", "concise"},
]


def _contradicts(strength: str, improvement: str) -> bool:
    s = (strength or "").lower()
    i = (improvement or "").lower()
    for axis in _AXES:
        if any(k in s for k in axis) and any(k in i for k in axis):
            return True
    return False


PROMPT_SCHEMA = """{
  "strength": "<one-sentence specific strength that quotes a phrase from the user's answer>",
  "improvement_now": "<one-sentence concrete fix the user can apply on the very next answer; quote or reference their actual wording>",
  "improvement_later": "<one-sentence longer-term skill to drill over multiple practice sessions>",
  "sample_better": "<a complete realistic answer that a strong candidate might give to this exact question; MUST include at least one concrete element (number, timeline, name, tool, role) absent from the user's answer; MUST NOT just reword the user's answer; same language as user_lang>",
  "sample_best": "<an even stronger version that builds on sample_better with one extra dimension (deeper insight, broader context, sharper closing); same language as user_lang>"
}"""


def _build_prompt(question: str, user_answer: str, lang: str, qtype: str) -> str:
    user_lang = "Mongolian (Cyrillic, polite Та-form)" if lang == "mn" else "English"
    return f"""You are an interview coach generating feedback for one question.

QUESTION ({qtype}): {question}
USER_ANSWER: {user_answer}
USER_LANG: {user_lang}

Return ONLY a JSON object matching this schema (no prose, no markdown fence):
{PROMPT_SCHEMA}

Hard rules:
- All five fields must be in {user_lang}.
- strength and improvement_now MUST NOT contradict each other on the same axis (e.g. don't praise pacing AND say to fix pacing).
- sample_better MUST share less than 60% of word tokens with USER_ANSWER (it is a *different* answer, not a rewording).
- sample_better MUST contain at least one concrete element (number, timeline, role/title, tool name, or proper noun) that does NOT appear in USER_ANSWER.
- improvement_now MUST reference something specific from USER_ANSWER (quote a phrase or name what was missing).
- If Mongolian: use polite Та/Таны/тань forms; never чи/чинь/чамайг.
- Keep each field to ONE sentence except samples (samples may be 2-4 sentences)."""


def _strip_to_json(text: str) -> str:
    """Find the first {...} block — handles models that wrap JSON in prose or fences."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return text
    return text[start : end + 1]


def _validate(payload: dict, user_answer: str) -> Optional[str]:
    """Return None if payload passes all checks, else a reason string."""
    required = ["strength", "improvement_now", "improvement_later", "sample_better", "sample_best"]
    for k in required:
        v = payload.get(k)
        if not isinstance(v, str) or not v.strip():
            return f"missing or empty: {k}"
    if _contradicts(payload["strength"], payload["improvement_now"]):
        return "strength contradicts improvement_now"
    if _contradicts(payload["strength"], payload["improvement_later"]):
        return "strength contradicts improvement_later"
    if _overlap(payload["sample_better"], user_answer) >= 0.6:
        return "sample_better too similar to user_answer"
    return None


def generate(
    *,
    question: str,
    user_answer: str,
    lang: str = "mn",
    qtype: str = "general",
) -> Optional[dict]:
    """Call Claude and return a validated feedback dict, or None on any failure."""
    client = _get_client()
    if client is None:
        return None
    prompt = _build_prompt(question, user_answer, lang, qtype)
    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=1024,
            temperature=0.5,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = "".join(b.text for b in msg.content if hasattr(b, "text"))
    except Exception as e:
        log.warning("anthropic call failed: %s", e)
        return None

    try:
        payload = json.loads(_strip_to_json(raw))
    except json.JSONDecodeError as e:
        log.warning("anthropic returned non-JSON: %s | head=%r", e, raw[:200])
        return None

    err = _validate(payload, user_answer)
    if err:
        log.info("LLM output rejected: %s", err)
        return None

    return {
        "strength":          payload["strength"].strip(),
        "improvement_now":   payload["improvement_now"].strip(),
        "improvement_later": payload["improvement_later"].strip(),
        "sample_better":     payload["sample_better"].strip(),
        "sample_best":       payload["sample_best"].strip(),
    }
