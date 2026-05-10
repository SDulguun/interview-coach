"""One-sentence interviewer reaction tailored to the candidate's answer."""
from fastapi import APIRouter
from pydantic import BaseModel

from ..nlp import llm_reaction


router = APIRouter(prefix="/api/reaction", tags=["reaction"])


class ReactionRequest(BaseModel):
    question: str
    answer: str
    lang: str = "mn"
    difficulty: str = "medium"
    is_last_question: bool = False
    job_title: str = ""


_FALLBACK_MN = "За, ойлголоо. Дараагийн асуулт руу шилжье."
_FALLBACK_EN = "Got it, thank you — let's move on to the next question."

_FALLBACK_LAST_MN = (
    "Цагаа гарган ярилцлагад оролцсонд тань маш их баярлалаа — танд амжилт хүсье!"
)
_FALLBACK_LAST_EN = (
    "Thank you so much for your time today — we really enjoyed the conversation. Best of luck!"
)


def _fallback(lang: str, is_last: bool) -> str:
    if is_last:
        return _FALLBACK_LAST_MN if lang == "mn" else _FALLBACK_LAST_EN
    return _FALLBACK_MN if lang == "mn" else _FALLBACK_EN


@router.post("/generate")
async def generate_reaction(req: ReactionRequest):
    reaction = llm_reaction.generate(
        question=req.question,
        answer=req.answer,
        lang=req.lang,
        difficulty=req.difficulty,
        is_last=req.is_last_question,
        job_title=req.job_title,
    )
    if not reaction:
        return {"reaction": _fallback(req.lang, req.is_last_question), "source": "fallback"}
    return {"reaction": reaction, "source": "llm"}
