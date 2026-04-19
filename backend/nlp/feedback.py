"""Rule-based feedback generation combining all metrics."""
from ..config import BENCHMARKS, SCORE_WEIGHTS


# ─── Question type classification ───
INTRO_KEYWORDS = ["танилцуулна", "өөрийгөө", "introduce", "about yourself"]
MOTIVATION_KEYWORDS = ["яагаад", "сонирхол", "why", "motivation", "сонирхолтой", "сэдэл"]
BEHAVIORAL_KEYWORDS = [
    "туршлага", "нөхцөл", "шийдвэрлэсэн", "жишээ", "хэрхэн",
    "experience", "situation", "challenge", "difficult", "tell me about a time",
    "амжилт", "бахарх", "тохиолдол",
]
TECHNICAL_KEYWORDS = [
    "мэргэжлийн", "техникийн", "арга барил", "технологи",
    "technical", "methodology", "approach", "tools",
]
CLOSING_KEYWORDS = [
    "асуух зүйл", "мэдэхийг", "нэмэлт", "questions for us", "anything else",
    "сүүлд", "хамгийн сүүлд", "нэмж хэлэх",
]


def _classify_question(question: str) -> str:
    """Classify interview question type for tailored feedback."""
    q = question.lower()
    if any(kw in q for kw in INTRO_KEYWORDS):
        return "introduction"
    if any(kw in q for kw in MOTIVATION_KEYWORDS):
        return "motivation"
    if any(kw in q for kw in TECHNICAL_KEYWORDS):
        return "technical"
    if any(kw in q for kw in CLOSING_KEYWORDS):
        return "closing"
    if any(kw in q for kw in BEHAVIORAL_KEYWORDS):
        return "behavioral"
    return "general"


def _score_word_count(word_count: int) -> tuple[float, list[str], list[str]]:
    """Score word count against benchmarks. Returns (score_0_100, strengths, improvements)."""
    median = BENCHMARKS["word_count_median"]
    q1 = BENCHMARKS["word_count_q1"]
    q3 = BENCHMARKS["word_count_q3"]

    strengths = []
    improvements = []

    if q1 <= word_count <= q3:
        score = 90.0
        strengths.append(f"Хариултын урт тохиромжтой ({word_count} үг)")
    elif word_count > q3:
        over = min((word_count - q3) / q3, 0.5)
        score = max(90.0 - over * 60, 50.0)
        improvements.append(f"Хариулт арай урт байна ({word_count} үг). Товчлоход дасгал хийгээрэй.")
    elif word_count >= 10:
        under = (q1 - word_count) / q1
        score = max(70.0 - under * 60, 30.0)
        improvements.append(f"Хариулт богино байна ({word_count} үг). Жишээ нэмж дэлгэрүүлээрэй.")
    else:
        score = 20.0
        improvements.append(f"Хариулт маш богино байна ({word_count} үг). Жишээ, тайлбартай дэлгэрэнгүй хариулаарай.")

    return score, strengths, improvements


def _score_fillers(filler_count: int, word_count: int) -> tuple[float, list[str], list[str]]:
    """Score filler word usage."""
    strengths = []
    improvements = []

    if filler_count == 0:
        score = 100.0
        strengths.append("Хариулт тодорхой, дүүргэгч үггүй")
    elif filler_count == 1:
        score = 85.0
        strengths.append("Дүүргэгч үг бага ашигласан")
    elif filler_count == 2:
        score = 65.0
        improvements.append("Дүүргэгч үг хэд хэд байна. Бодолтой зогсолт ашиглахыг зөвлөж байна.")
    else:
        score = max(40.0 - (filler_count - 3) * 10, 10.0)
        improvements.append(f"Дүүргэгч үг хэт олон ({filler_count}). Бодолтой зогсолтоор (pause) солих дасгал хийгээрэй.")

    return score, strengths, improvements


def _score_ttr(ttr: float) -> tuple[float, list[str], list[str]]:
    """Score vocabulary richness."""
    strengths = []
    improvements = []
    mean = BENCHMARKS["ttr_mean"]

    if ttr >= mean:
        score = min(85.0 + (ttr - mean) * 200, 100.0)
        strengths.append("Үгийн сан баялаг, олон төрлийн илэрхийлэл ашигласан")
    elif ttr >= 0.80:
        score = 75.0
    else:
        score = max(50.0 - (0.80 - ttr) * 200, 25.0)
        improvements.append("Зарим үг давтагдаж байна. Илүү олон төрлийн илэрхийлэл ашиглаарай.")

    return score, strengths, improvements


def _score_structure(action_verb_count: int, star_score: float, question_type: str = "general") -> tuple[float, list[str], list[str]]:
    """Score answer structure, tailored to question type.

    Design principle: well-organized natural answers should score well
    even without strict STAR adherence. We use a generous base score
    and bonus system rather than a punitive deduction system.
    """
    strengths = []
    improvements = []

    if question_type == "introduction":
        # Introductions: clarity and completeness, not STAR
        base = 65.0
        if action_verb_count >= 2:
            base = 80.0
            strengths.append("Танилцуулга тодорхой, үйл үг зохистой ашигласан")
        elif action_verb_count >= 1:
            base = 72.0
        score = base

    elif question_type == "motivation":
        # Motivation: enthusiasm and reasoning
        base = 60.0
        if action_verb_count >= 2:
            base = 70.0
            strengths.append("Сэдлээ тодорхой илэрхийлсэн")
        elif action_verb_count >= 1:
            base = 65.0
        star_bonus = star_score * 20.0
        score = base + star_bonus

    elif question_type == "behavioral":
        # Behavioral: full STAR + action verb scoring
        base = 40.0
        if action_verb_count >= 3:
            base = 55.0
            strengths.append(f"Үйл үгийг идэвхтэй ашигласан ({action_verb_count})")
        elif action_verb_count >= 1:
            base = 45.0

        star_bonus = star_score * 45.0
        if star_score >= 0.75:
            strengths.append("STAR аргачлалыг сайн ашигласан")
        elif star_score >= 0.5:
            improvements.append("STAR аргачлалын зарим хэсгийг нэмж дурдвал хариулт илүү бүтэцтэй болно.")
        elif star_score < 0.25:
            improvements.append("Нөхцөл байдал, хийсэн зүйл, үр дүнгээ тодорхой тусгаж ярихыг зөвлөж байна.")
        score = base + star_bonus

    elif question_type == "technical":
        # Technical: knowledge demonstration, less STAR dependency
        base = 60.0
        if action_verb_count >= 2:
            base = 72.0
            strengths.append("Мэргэжлийн тайлбар тодорхой")
        elif action_verb_count >= 1:
            base = 66.0
        star_bonus = star_score * 20.0
        score = base + star_bonus

    elif question_type == "closing":
        # Closing questions: engagement and thoughtfulness
        base = 70.0
        if action_verb_count >= 1:
            base = 78.0
        score = base

    else:
        # General questions: moderate but fair scoring
        base = 50.0
        if action_verb_count >= 3:
            base = 65.0
            strengths.append(f"Тодорхой илэрхийлсэн ({action_verb_count} үйл үг)")
        elif action_verb_count >= 2:
            base = 60.0
        elif action_verb_count >= 1:
            base = 55.0

        star_bonus = star_score * 30.0
        if star_score >= 0.75:
            strengths.append("Хариултын бүтэц сайн зохион байгуулагдсан")
        score = base + star_bonus

    # Floor: no answer with any substance should score below 40
    score = max(score, 40.0)
    # Cap at 100
    score = min(score, 100.0)

    return score, strengths, improvements


def _score_relevance(combined_score: float, matched: list, missing: list) -> tuple[float, list[str], list[str]]:
    """Score relevance to job listing. More generous with partial matches."""
    strengths = []
    improvements = []

    # Apply a floor: even low TF-IDF overlap should not give 0
    score = max(combined_score * 100.0, 35.0) if combined_score > 0 else 75.0

    if matched:
        strengths.append(f"Шаардлагатай ур чадваруудыг хариултдаа тусгасан: {', '.join(matched[:3])}")
    if missing and len(missing) <= 2:
        improvements.append(f"Дараах чадваруудыг жишээгээр нэмж дурдвал илүү сайн: {', '.join(missing)}")
    elif missing:
        improvements.append(f"Зарим шаардлагатай чадваруудыг хариултандаа холбох боломжтой: {', '.join(missing[:3])}")

    return score, strengths, improvements


def generate_feedback(
    text_metrics: dict,
    filler_result: dict,
    structure_result: dict,
    relevance_result: dict | None = None,
    question: str = "",
) -> dict:
    """Generate comprehensive feedback from all analysis results."""
    word_count = text_metrics["word_count"]
    filler_count = filler_result["total_count"]
    ttr = text_metrics["ttr"]
    action_verb_count = structure_result["action_verbs"]["count"]
    star_score = structure_result["star_method"]["score"]

    # Classify question type for tailored feedback
    question_type = _classify_question(question) if question else "general"

    # Score each dimension
    wc_score, wc_str, wc_imp = _score_word_count(word_count)
    fl_score, fl_str, fl_imp = _score_fillers(filler_count, word_count)
    ttr_score, ttr_str, ttr_imp = _score_ttr(ttr)
    st_score, st_str, st_imp = _score_structure(action_verb_count, star_score, question_type)

    all_strengths = wc_str + fl_str + ttr_str + st_str
    all_improvements = wc_imp + fl_imp + ttr_imp + st_imp
    suggestions = []

    # Relevance scoring
    if relevance_result and relevance_result.get("combined_score", 0) > 0:
        rel_matched = relevance_result.get("keyword_match", {}).get("matched_skills", [])
        rel_missing = relevance_result.get("keyword_match", {}).get("missing_skills", [])
        rel_score, rel_str, rel_imp = _score_relevance(
            relevance_result["combined_score"], rel_matched, rel_missing
        )
        all_strengths += rel_str
        all_improvements += rel_imp
    else:
        rel_score = 75.0  # no job context — don't penalize

    # Overall score (weighted)
    overall = (
        wc_score * SCORE_WEIGHTS["word_count"]
        + fl_score * SCORE_WEIGHTS["filler"]
        + ttr_score * SCORE_WEIGHTS["ttr"]
        + st_score * SCORE_WEIGHTS["structure"]
        + rel_score * SCORE_WEIGHTS["relevance"]
    )

    # ─── Question-type-aware suggestions (polite, constructive tone) ───
    if word_count < 15:
        suggestions.append("Хариултаа жишээгээр дэлгэрүүлвэл илүү итгэлтэй сонсогдоно.")
    if filler_count >= 3:
        suggestions.append("Бодолтой зогсолт (pause) ашиглаж дүүргэгч үгийг багасгахыг зөвлөж байна.")

    if question_type == "behavioral" and star_score < 0.5 and word_count >= 20:
        suggestions.append("Туршлагын асуултад нөхцөл байдал, хийсэн зүйл, үр дүнгээ тодорхой тусгахыг зөвлөж байна.")
    elif question_type == "introduction" and word_count >= 10:
        if wc_score >= 80:
            suggestions.append("Танилцуулга тодорхой байна. Энэ ажлын байранд яагаад нийцэхээ нэмж дурдвал илүү сайн.")
        else:
            suggestions.append("Нэр, боловсрол, хамгийн чухал туршлагаа товч дурдаарай.")
    elif question_type == "motivation":
        suggestions.append("Сэдлээ тодорхой жишээгээр баталгаажуулвал илүү итгэлтэй сонсогдоно.")
    elif question_type == "technical":
        suggestions.append("Мэргэжлийн мэдлэгээ тодорхой жишээ, туршлагаар баяжуулаарай.")

    # If overall score is already strong, limit suggestions
    if overall >= 80 and len(suggestions) > 1:
        suggestions = suggestions[:1]

    return {
        "overall_score": round(overall, 1),
        "dimension_scores": {
            "word_count": round(wc_score, 1),
            "filler": round(fl_score, 1),
            "ttr": round(ttr_score, 1),
            "structure": round(st_score, 1),
            "relevance": round(rel_score, 1),
        },
        "strengths": all_strengths,
        "improvements": all_improvements,
        "suggestions": suggestions,
    }
