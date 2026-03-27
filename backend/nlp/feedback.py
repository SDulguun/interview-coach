"""Rule-based feedback generation combining all metrics."""
from ..config import BENCHMARKS, SCORE_WEIGHTS


# ─── Question type classification ───
INTRO_KEYWORDS = ["танилцуулна", "өөрийгөө", "introduce", "about yourself"]
MOTIVATION_KEYWORDS = ["яагаад", "сонирхол", "why", "motivation", "сонирхолтой"]
BEHAVIORAL_KEYWORDS = [
    "туршлага", "нөхцөл", "шийдвэрлэсэн", "жишээ", "хэрхэн",
    "experience", "situation", "challenge", "difficult", "tell me about a time",
    "амжилт", "бахарх",
]


def _classify_question(question: str) -> str:
    """Classify interview question type for tailored feedback."""
    q = question.lower()
    if any(kw in q for kw in INTRO_KEYWORDS):
        return "introduction"
    if any(kw in q for kw in MOTIVATION_KEYWORDS):
        return "motivation"
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
        strengths.append(f"Хариултын урт тохиромжтой ({word_count} үг, жишиг: {q1}-{q3})")
    elif word_count > q3:
        over = min((word_count - q3) / q3, 0.5)
        score = max(90.0 - over * 60, 50.0)
        improvements.append(f"Хариулт хэт урт байна ({word_count} үг). {q3} үгээс бага байвал зүгээр.")
    elif word_count >= 10:
        under = (q1 - word_count) / q1
        score = max(70.0 - under * 60, 30.0)
        improvements.append(f"Хариулт богино байна ({word_count} үг). Дор хаяж {q1} үг хэлэх хэрэгтэй.")
    else:
        score = 20.0
        improvements.append(f"Хариулт маш богино байна ({word_count} үг). Жишээ, тайлбартай дэлгэрэнгүй хариулна уу.")

    return score, strengths, improvements


def _score_fillers(filler_count: int, word_count: int) -> tuple[float, list[str], list[str]]:
    """Score filler word usage."""
    strengths = []
    improvements = []

    if filler_count == 0:
        score = 100.0
        strengths.append("Дүүргэгч үг ашиглаагүй — маш сайн!")
    elif filler_count == 1:
        score = 80.0
        strengths.append("Дүүргэгч үг бага ашигласан (1 удаа)")
    elif filler_count == 2:
        score = 60.0
        improvements.append("Дүүргэгч үг 2 удаа ашигласан. Багасгахыг хичээгээрэй.")
    else:
        score = max(40.0 - (filler_count - 3) * 10, 10.0)
        improvements.append(f"Дүүргэгч үг хэт олон ({filler_count} удаа). 'тэгээд', 'тиймээ' гэх мэт үгсийг хасаарай.")

    return score, strengths, improvements


def _score_ttr(ttr: float) -> tuple[float, list[str], list[str]]:
    """Score vocabulary richness."""
    strengths = []
    improvements = []
    mean = BENCHMARKS["ttr_mean"]

    if ttr >= mean:
        score = min(85.0 + (ttr - mean) * 200, 100.0)
        strengths.append(f"Үгийн сан баялаг (TTR: {ttr:.2f})")
    elif ttr >= 0.80:
        score = 70.0
        improvements.append(f"Үгийн сан дундаж (TTR: {ttr:.2f}). Илүү олон төрлийн үг хэрэглэнэ үү.")
    else:
        score = max(50.0 - (0.80 - ttr) * 200, 20.0)
        improvements.append(f"Үгийн сан давтагдаж байна (TTR: {ttr:.2f}). Ижил утгатай өөр үгс хэрэглэнэ үү.")

    return score, strengths, improvements


def _score_structure(action_verb_count: int, star_score: float, question_type: str = "general") -> tuple[float, list[str], list[str]]:
    """Score answer structure, tailored to question type."""
    strengths = []
    improvements = []

    if question_type == "introduction":
        # For introductions: evaluate clarity and completeness, not STAR/action verbs
        if action_verb_count >= 1:
            score = 75.0
            strengths.append("Танилцуулгадаа үйл үг ашигласан")
        else:
            score = 60.0

        # Give a generous base score for introductions
        score = max(score, 60.0)
        if score < 80.0:
            improvements.append("Боловсрол, туршлага, зорилгоо тодорхой дурдаарай")

    elif question_type == "motivation":
        # For motivation: evaluate enthusiasm and reasoning, mild action verb check
        if action_verb_count >= 2:
            av_score = 40.0
            strengths.append("Сэдэлжүүлэх хариулт өгсөн")
        elif action_verb_count >= 1:
            av_score = 30.0
        else:
            av_score = 20.0
            improvements.append("Сонирхлын шалтгаанаа тодорхой тайлбарлаарай")

        # Lighter STAR weight for motivation questions
        star_points = star_score * 30.0
        score = av_score + star_points + 20.0  # base bonus

    elif question_type == "behavioral":
        # For behavioral: full STAR + action verb scoring (original logic)
        if action_verb_count >= 3:
            av_score = 50.0
            strengths.append(f"Үйл үгийг идэвхтэй ашигласан ({action_verb_count} ш)")
        elif action_verb_count >= 1:
            av_score = 30.0
        else:
            av_score = 10.0
            improvements.append("Идэвхтэй үйл үг ашиглаарай (жишээ нь: хийсэн, удирдсан, шийдвэрлэсэн)")

        star_points = star_score * 50.0
        if star_score >= 0.75:
            strengths.append("STAR аргачлалыг сайн ашигласан (Нөхцөл-Даалгавар-Үйлдэл-Үр дүн)")
        elif star_score >= 0.5:
            improvements.append("STAR аргачлалыг бүрэн бус ашигласан. Үр дүнгээ заавал дурдаарай.")
        else:
            improvements.append("STAR аргачлал ашиглаарай: Нөхцөл байдал → Даалгавар → Юу хийсэн → Үр дүн")

        score = av_score + star_points

    else:
        # General questions: moderate scoring
        if action_verb_count >= 2:
            av_score = 45.0
            strengths.append(f"Үйл үг ашигласан ({action_verb_count} ш)")
        elif action_verb_count >= 1:
            av_score = 30.0
        else:
            av_score = 15.0
            improvements.append("Хариултдаа илүү тодорхой жишээ оруулаарай")

        star_points = star_score * 35.0
        score = av_score + star_points + 10.0  # small base bonus

    return score, strengths, improvements


def _score_relevance(combined_score: float, matched: list, missing: list) -> tuple[float, list[str], list[str]]:
    """Score relevance to job listing."""
    strengths = []
    improvements = []

    score = combined_score * 100.0

    if matched:
        strengths.append(f"Ажлын байрны шаардлагатай нийцсэн ур чадварууд: {', '.join(matched)}")
    if missing:
        improvements.append(f"Дараах ур чадваруудыг дурдаагүй: {', '.join(missing)}")

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

        if rel_missing:
            suggestions.append(
                f"Хариултандаа дараах ур чадваруудтай холбоотой жишээ нэмээрэй: {', '.join(rel_missing[:3])}"
            )
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

    # Question-type-aware suggestions
    if word_count < 15:
        suggestions.append("Хариултаа дэлгэрэнгүй болгохыг зөвлөж байна. Жишээ оруулаарай.")
    if filler_count >= 2:
        suggestions.append("Дүүргэгч үгийг бодолтой зогсолтоор (pause) солиорой.")

    if question_type == "behavioral" and star_score < 0.5 and word_count >= 20:
        suggestions.append("Туршлагын асуултад STAR аргачлалаар хариулаарай.")
    elif question_type == "introduction" and word_count >= 10:
        suggestions.append("Танилцуулгадаа нэр, боловсрол, туршлага, зорилгоо багтаагаарай.")
    elif question_type == "motivation":
        suggestions.append("Компанийн талаар судалгаа хийж, тодорхой шалтгаан дурдаарай.")

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
