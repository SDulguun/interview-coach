"""Per-question breakdown for the results screen."""
import re
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..nlp.pipeline import InterviewAnalyzer
from ..nlp.feedback import _classify_question
from ..nlp import llm_feedback


router = APIRouter(prefix="/api/feedback", tags=["feedback"])
analyzer = InterviewAnalyzer()

# In-memory cache keyed by (session_id, question_index).
_cache: dict[tuple[str, int], dict] = {}


class BreakdownRequest(BaseModel):
    session_id: str
    question_index: int
    question: str
    user_answer: str
    lang: str = "mn"
    duration_seconds: int = 0
    was_voice: bool = False
    sample_answer: Optional[str] = None


_NUMERIC_RE = re.compile(r"\b\d+([.,]\d+)?\b")
_WORD_RE = re.compile(r"[\w'’]+", re.UNICODE)


def _first_sentence(text: str) -> str:
    parts = re.split(r"[.!?…]+", text.strip(), maxsplit=1)
    s = parts[0].strip()
    return s[:80] + ("…" if len(s) > 80 else "") if s else ""


def _tokens(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text or "") if len(w) > 2}


def _lexical_overlap(a: str, b: str) -> float:
    """Jaccard overlap on lowercased word tokens (>2 chars). 0..1."""
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(1, len(ta | tb))


def _grounded_lists(
    req: BreakdownRequest, metrics: dict, feedback: dict, scores: dict[str, int]
) -> tuple[list[str], list[str]]:
    """Strengths/improvements that reference the actual answer."""
    text = req.user_answer.strip()
    word_count = metrics["text"]["word_count"]
    filler_count = metrics["fillers"]["total_count"]
    star_score = metrics["structure"]["star_method"]["score"]
    action_verbs = metrics["structure"]["action_verbs"]["count"]
    has_numbers = bool(_NUMERIC_RE.search(text))
    qtype = _classify_question(req.question) if req.question else "general"
    mn = req.lang == "mn"

    strengths: list[str] = []
    improvements: list[str] = []

    if has_numbers:
        strengths.append(
            "Тоон жишээ оруулсан нь хариултыг тодорхой бөгөөд итгэл төрүүлэхүйц болгож байна."
            if mn else
            "You included concrete numbers, which makes the answer specific and credible."
        )
    elif qtype == "behavioral" and word_count >= 25:
        improvements.append(
            "Хийсэн ажлынхаа үр дүнг тоогоор илэрхийлбэл (жишээ нь '3 сарын дотор', '20%-иар') илүү хүчтэй сонсогдоно."
            if mn else
            "Add a concrete number to your result (e.g., \"in 3 months\", \"by 20%\") for more impact."
        )

    if action_verbs >= 3:
        strengths.append(
            f"{action_verbs} үйл үг ашигласнаар үйл хөдлөл тодорхой харагдсан."
            if mn else
            f"You used {action_verbs} action verbs, which makes your contribution clear."
        )
    elif action_verbs <= 1 and word_count >= 20:
        improvements.append(
            "Идэвхтэй үйл үг (хийсэн, удирдсан, хариуцсан) ашиглавал өөрийн хувь нэмрээ илүү тодорхой харуулна."
            if mn else
            "Use more active verbs (\"led\", \"built\", \"owned\") to highlight your contribution."
        )

    if qtype == "behavioral":
        if star_score >= 0.75:
            strengths.append(
                "STAR бүтэц (нөхцөл-зорилт-үйлдэл-үр дүн) сайн ажиглагдаж байна."
                if mn else
                "Your answer follows the STAR structure well."
            )
        elif star_score < 0.4:
            improvements.append(
                "STAR бүтцийн 'Result' хэсэг дутуу — эцсийн үр дүнгээ 1-2 өгүүлбэрээр нэмбэл илүү сайн."
                if mn else
                "The Result part of STAR is missing — close with 1–2 sentences on the outcome."
            )

    if filler_count == 0 and word_count >= 15:
        strengths.append(
            "Дүүргэгч үггүй, цэвэр ярьсан."
            if mn else
            "Clean delivery — no filler words."
        )
    elif filler_count >= 3:
        improvements.append(
            f"Дүүргэгч үг {filler_count} удаа гарсан. Бодолтой зогсолтоор солих дасгал хий."
            if mn else
            f"You used {filler_count} fillers. Practice replacing them with a brief pause."
        )

    if word_count < 20 and qtype != "closing":
        improvements.append(
            f"Хариулт {word_count} үгтэй — товчхон. 1-2 жишээ нэмж дэлгэрүүлвэл илүү бүрэн сонсогдоно."
            if mn else
            f"At {word_count} words your answer is brief. Add 1–2 examples to round it out."
        )
    elif 30 <= word_count <= 100:
        first = _first_sentence(text)
        if first:
            strengths.append(
                f"Эхний өгүүлбэр '{first}' нь сонсогчийн анхаарлыг тогтоохоор тодорхой эхлэл байлаа."
                if mn else
                f"Your opening line \"{first}\" sets up the answer clearly."
            )

    # de-dup while preserving order
    def dedup(seq):
        seen = set(); out = []
        for s in seq:
            if s not in seen:
                seen.add(s); out.append(s)
        return out

    return dedup(strengths), dedup(improvements)


def _fallback_strengths(lang: str) -> list[str]:
    return (
        ["Хариулт ойлгомжтой бөгөөд асуултанд чиглэсэн байна."]
        if lang == "mn"
        else ["The answer is clear and stays on topic."]
    )


def _fallback_improvements(lang: str) -> list[str]:
    return (
        ["Тодорхой жишээ, тоон үр дүнгээр баяжуулбал илүү хүчтэй болно."]
        if lang == "mn"
        else ["Add a specific example or measurable result for more weight."]
    )


def _build_samples(req: BreakdownRequest) -> list[dict]:
    """Build 'better' and 'best' sample answers grounded in the question category.

    Self-validation: each sample must be lexically distinct from the user's
    answer (Jaccard overlap < 0.7) so it is *demonstrably* different. If the
    provided sample is too close, fall back to a generic template.
    """
    mn = req.lang == "mn"
    qtype = _classify_question(req.question) if req.question else "general"
    user_text = req.user_answer or ""

    if req.sample_answer and _lexical_overlap(req.sample_answer, user_text) < 0.7:
        better = req.sample_answer.strip()
    else:
        better = _generic_better(qtype, mn)
        # Final guard: if even the template is too close, append a divergent clause
        if _lexical_overlap(better, user_text) >= 0.7:
            better = better + (
                " Үүн дээр нэмж хэлэхэд, хэмжигдэхүйц үр дүнгээ (хувь, хугацаа, тоон үзүүлэлт) тодорхой дурдсан нь хариултыг эрс ялгаатай болгоно."
                if mn else
                " On top of that, naming a measurable result (percentage, timeline, count) is what makes this version meaningfully different."
            )

    best = _generic_best(qtype, mn, base=better)
    return [
        {"quality": "better", "text": better},
        {"quality": "best", "text": best},
    ]


_KEEP_FALLBACK_MN = "Хариултын ерөнхий бүтэц цэгцтэй — энэ хэвийг үргэлжлүүлэн хадгалаарай."
_KEEP_FALLBACK_EN = "Your overall structure stays on track — keep that habit."

_NOW_FALLBACK_MN = "Дараагийн хариултдаа эхний өгүүлбэрт нэг тоон үр дүн (хувь, хугацаа, хэмжээ) шууд оруулаарай."
_NOW_FALLBACK_EN = "In your next answer, lead with one concrete number (percentage, timeline, scale) in the first sentence."

_LATER_FALLBACK_MN = "Удаан хугацаанд: STAR бүтцийг 5-6 ярилцлага дасгалаар тогтмол давтаж, рефлекс болгож сурахыг хүсье."
_LATER_FALLBACK_EN = "Longer-term: drill the STAR structure across 5–6 mock interviews until it becomes reflexive."


def _shape_recommendations(
    strengths: list[str], improvements: list[str], lang: str
) -> tuple[list[str], list[str]]:
    """Force the recommendation set to a 1-keep + 1-now + 1-later mix.

    Returns (strengths, improvements) where len(strengths) == 1 and
    len(improvements) == 2 — total of three recommendations on the page.
    """
    mn = lang == "mn"
    keep = strengths[0] if strengths else (_KEEP_FALLBACK_MN if mn else _KEEP_FALLBACK_EN)
    now = improvements[0] if improvements else (_NOW_FALLBACK_MN if mn else _NOW_FALLBACK_EN)
    if len(improvements) >= 2:
        later = improvements[1]
    else:
        later = _LATER_FALLBACK_MN if mn else _LATER_FALLBACK_EN
    return [keep], [now, later]


_BETTER_TEMPLATES_MN = {
    "introduction": "Намайг Б. Болормаа гэдэг. Сүүлийн 3 жил backend хөгжүүлэгчээр Node.js, PostgreSQL дээр ажилласан. Сүүлийн ажилдаа төлбөрийн системийн API-г бүхэлд нь өөрөө хариуцаж, өдөрт 10 мянган гүйлгээ амжилттай хийгддэг болгосон.",
    "motivation": "Энэ ажлын зар миний хэдэн жил эрэлхийлж байсан зүйлтэй яг таарч байна — миний backend туршлага болон энэ багийн техникийн хүрээ хоёр харилцан нөхөж чадна гэж итгэж байна.",
    "behavioral": "Өмнөх ажилдаа маань шинэ сангийн модулийн deadline-ийг 2 долоо хоног урагшлуулахаар болсон. Би багийнхантайгаа ярилцаад ажлын урсгалыг 3 хэсэгт хуваан, өдөр бүр 30 минутын stand-up зохион байгуулсан. Үр дүнд нь хугацаандаа дуусгаж, нэмэлт цаг хэтрэлтгүй гарсан.",
    "technical": "Системийг scaling хийхдээ хамгийн түрүүнд bottleneck-ийг profiling хэрэгсэлээр (datadog, py-spy) олдог. Дараа нь хамгийн их ачаалалтай хэсгийг (ихэвчлэн DB query) индекс эсвэл кэш нэмэх замаар оновчлоно. Сүүлд 80% query-г redis кэш дээр шилжүүлэхэд хариу өгөх хугацаа 400ms-ээс 80ms болсон.",
    "closing": "Багийн өдөр тутмын ажлын хэмнэл болон шийдвэр гаргалт хэрхэн явагддаг талаар сонирхож байна — хэн нэгэн санаа гаргавал тэр хүртэл явагдах процесс ямар вэ?",
    "general": "Миний хувьд энэ ажилд хамгийн чухал нь бодит асуудлыг шийдэх боломж — backend хөгжүүлэгчийн хувиар миний өмнөх 3 жилийн туршлага яг тийм асуудлуудыг шийдэхэд чиглэсэн.",
}

_BETTER_TEMPLATES_EN = {
    "introduction": "I'm a backend developer with 3 years building Node.js + PostgreSQL services. Most recently I owned the payments API end-to-end, handling 10k transactions per day with a 99.9% success rate.",
    "motivation": "This role lines up with what I've been building toward — my backend experience and your team's technical scope feel like a strong fit on both sides.",
    "behavioral": "On my last team a deadline got pulled forward by two weeks. I split the work into three streams, ran a daily 30-minute stand-up, and we shipped on time without overtime. The release went out clean.",
    "technical": "When I scale a system I start with profiling (datadog, py-spy) to find the actual bottleneck — usually a DB query. I optimize with indexes or a cache layer. On my last project, moving 80% of queries to Redis dropped p95 latency from 400ms to 80ms.",
    "closing": "I'd like to understand how the team makes day-to-day decisions — when someone has an idea, what does the path from idea to shipped look like?",
    "general": "What matters to me in this role is solving real problems — my last three years as a backend engineer were spent on exactly that kind of work.",
}


def _generic_better(qtype: str, mn: bool) -> str:
    table = _BETTER_TEMPLATES_MN if mn else _BETTER_TEMPLATES_EN
    return table.get(qtype, table["general"])


def _generic_best(qtype: str, mn: bool, base: str) -> str:
    """Construct a 'best' version with a stronger result clause."""
    if mn:
        if qtype == "behavioral":
            return base + " Энэ туршлага надад хямралын үед гарал үүсгэдэг шийдвэрийг хурдан гаргах чадварыг нэмж өгсөн."
        if qtype == "introduction":
            return base + " Одоогийн ур чадвараа таны багийн backend асуудлуудыг шийдэхэд хэрэглэхийг хүсэж байна."
        if qtype == "motivation":
            return base + " Тийм учраас зөвхөн ажлын зар биш, тухайн багийн ажиллах арга барил, бүтээгдэхүүний урт хугацааны зорилт хоёр хоёулаа надад чухал."
        if qtype == "technical":
            return base + " Нэмж хэлэхэд, шийдлийг хэрэгжүүлэхдээ багийнхантайгаа load test хийж, regression-ийг өмнө нь барьж авдаг."
        if qtype == "closing":
            return base + " Мөн эхний 90 хоногт юу хүлээж байгаа талаар дэлгэрэнгүй сонсох хүсэлтэй байна."
        return base + " Энэ үнэт зүйл миний ажлын сонголтод чиглүүлдэг гол шалгуур юм."
    else:
        if qtype == "behavioral":
            return base + " That experience taught me how to make fast decisions under pressure without losing the team."
        if qtype == "introduction":
            return base + " I'd like to bring that same ownership to your team's backend problems."
        if qtype == "motivation":
            return base + " That's why I care as much about how a team works as about the role itself."
        if qtype == "technical":
            return base + " I also pair the change with a load test so we catch any regression before it ships."
        if qtype == "closing":
            return base + " I'd also like to hear what the first 90 days typically look like."
        return base + " That's the kind of work I want to keep doing."


@router.post("/breakdown")
async def breakdown(req: BreakdownRequest):
    key = (req.session_id, req.question_index)
    if key in _cache:
        return _cache[key]

    if not req.user_answer.strip():
        raise HTTPException(status_code=400, detail="Empty answer")

    result = analyzer.analyze_response(
        response_text=req.user_answer,
        question=req.question,
    )
    feedback = result["feedback"]
    metrics = result["metrics"]
    dim = feedback["dimension_scores"]

    scores = {
        "clarity":   int(round(dim["word_count"])),
        "structure": int(round(dim["structure"])),
        "pace":      int(round(dim["filler"])),
        "relevance": int(round(dim["relevance"])),
    }

    strengths, improvements = _grounded_lists(req, metrics, feedback, scores)
    if not strengths:
        strengths = _fallback_strengths(req.lang)
    if not improvements:
        improvements = _fallback_improvements(req.lang)

    # Shape into exactly 3 recommendations: 1 keep + 1 immediate fix + 1 longer-term.
    shaped_strengths, shaped_improvements = _shape_recommendations(strengths, improvements, req.lang)
    samples = _build_samples(req)
    source = "template"

    # Optional LLM upgrade — overlay validated output on top of rule-based result.
    # On any failure we keep the rule-based response, so the endpoint stays functional.
    if llm_feedback.is_enabled():
        qtype = _classify_question(req.question) if req.question else "general"
        llm_out = llm_feedback.generate(
            question=req.question,
            user_answer=req.user_answer,
            lang=req.lang,
            qtype=qtype,
        )
        if llm_out is not None:
            shaped_strengths = [llm_out["strength"]]
            shaped_improvements = [llm_out["improvement_now"], llm_out["improvement_later"]]
            samples = [
                {"quality": "better", "text": llm_out["sample_better"]},
                {"quality": "best",   "text": llm_out["sample_best"]},
            ]
            source = "llm"

    response = {
        "question":         req.question,
        "user_answer":      req.user_answer,
        "word_count":       metrics["text"]["word_count"],
        "duration_seconds": req.duration_seconds,
        "was_voice":        req.was_voice,
        "scores":           scores,
        "strengths":        shaped_strengths,
        "improvements":     shaped_improvements,
        "sample_answers":   samples,
        "source":           source,
    }
    _cache[key] = response
    return response
