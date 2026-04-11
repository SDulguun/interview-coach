"""Relevance scoring: TF-IDF + cosine similarity + keyword matching."""
import re
import math
from collections import Counter

# Skill keywords from EDA cell 24
SKILL_KEYWORDS = {
    'Харилцааны чадвар': ['харилцаа', 'ярих', 'тайлбарлах', 'илэрхийлэх', 'сонсох'],
    'Багаар ажиллах':    ['баг', 'хамтран', 'хамтдаа', 'хамт'],
    'Цагийн менежмент':  ['цаг', 'хугацаа', 'хуваарь'],
    'Нягт нямбай':       ['нарийвчлал', 'анхааралтай', 'нямбай', 'нарийн'],
    'Манлайлал':         ['манлайлал', 'удирдах', 'удирдлага', 'хариуцах'],
    'Дасан зохицох':     ['дасах', 'зохицох', 'уян хатан'],
    'Шинжилгээ хийх':    ['шинжилгээ', 'судалгаа', 'дүн шинжилгээ'],
    'Асуудал шийдвэрлэх': ['асуудал', 'шийдвэрлэх', 'шийдэл'],
}

# Mongolian stop words to exclude from TF-IDF
MN_STOP_WORDS = {
    'нь', 'бол', 'энэ', 'тэр', 'бид', 'би', 'та', 'юм', 'байна',
    'байсан', 'байгаа', 'гэж', 'гэсэн', 'болон', 'мөн', 'ч', 'л',
    'нэг', 'их', 'маш', 'ба', 'буюу', 'бас', 'дээр', 'доор',
    'руу', 'рүү', 'аас', 'ээс', 'оос', 'өөс', 'тай', 'тэй', 'той',
}


def _tokenize(text: str) -> list[str]:
    """Simple whitespace tokenization with punctuation removal."""
    if not text:
        return []
    words = re.findall(r'[\w]+', text.lower())
    return [w for w in words if w not in MN_STOP_WORDS and len(w) > 1]


def _tf(tokens: list[str]) -> dict[str, float]:
    """Term frequency."""
    counts = Counter(tokens)
    total = len(tokens)
    if total == 0:
        return {}
    return {word: count / total for word, count in counts.items()}


def _cosine_similarity(vec_a: dict, vec_b: dict) -> float:
    """Cosine similarity between two term-frequency vectors."""
    common_keys = set(vec_a.keys()) & set(vec_b.keys())
    if not common_keys:
        return 0.0

    dot = sum(vec_a[k] * vec_b[k] for k in common_keys)
    mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
    mag_b = math.sqrt(sum(v * v for v in vec_b.values()))

    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def compute_tfidf_relevance(response: str, job_description: str) -> float:
    """Compute TF-IDF-based cosine similarity between response and job description."""
    resp_tokens = _tokenize(response)
    job_tokens = _tokenize(job_description)

    if not resp_tokens or not job_tokens:
        return 0.0

    resp_tf = _tf(resp_tokens)
    job_tf = _tf(job_tokens)

    return round(_cosine_similarity(resp_tf, job_tf), 4)


def compute_keyword_relevance(response: str, required_skills: str) -> dict:
    """Match response against required skills using SKILL_KEYWORDS."""
    if not response or not required_skills:
        return {"score": 0.0, "matched_skills": [], "missing_skills": [], "total_required": 0}

    response_lower = response.lower()
    skills_list = [s.strip() for s in required_skills.split(',')]

    matched = []
    missing = []

    for skill in skills_list:
        skill_clean = skill.strip()
        if skill_clean in SKILL_KEYWORDS:
            keywords = SKILL_KEYWORDS[skill_clean]
            if any(kw in response_lower for kw in keywords):
                matched.append(skill_clean)
            else:
                missing.append(skill_clean)
        else:
            # Direct match: check if skill name appears in response
            if skill_clean.lower() in response_lower:
                matched.append(skill_clean)
            else:
                missing.append(skill_clean)

    total = len(matched) + len(missing)
    score = len(matched) / total if total > 0 else 0.0

    return {
        "score": round(score, 4),
        "matched_skills": matched,
        "missing_skills": missing,
        "total_required": total,
    }


def compute_relevance(
    response: str,
    question: str = "",
    job_description: str = "",
    required_skills: str = "",
) -> dict:
    """Combined relevance scoring with optional Core ML semantic similarity.

    When the Core ML embedding model is available, uses neural sentence
    embeddings for semantic similarity (response vs question/job description).
    Falls back to TF-IDF + keyword matching when the model is not loaded.
    """
    from .coreml_embeddings import is_embedding_model_available, compute_semantic_similarity

    tfidf_score = compute_tfidf_relevance(response, job_description) if job_description else 0.0
    keyword_result = compute_keyword_relevance(response, required_skills)

    # Semantic similarity via Core ML (if available)
    semantic_score = None
    if is_embedding_model_available() and question:
        try:
            raw_sim = compute_semantic_similarity(response, question)
            # Scale raw cosine similarity to a usable 0-1 range.
            # Q-A pairs get lower cosine sim than paraphrases (model is trained
            # for STS, not QA), so we rescale: [0, 0.6] → [0.3, 1.0].
            semantic_score = min(max(0.3 + raw_sim * 1.17, 0.0), 1.0)
            if job_description:
                job_sim = compute_semantic_similarity(response, job_description)
                job_scaled = min(max(0.3 + job_sim * 1.17, 0.0), 1.0)
                semantic_score = 0.6 * semantic_score + 0.4 * job_scaled
        except Exception:
            semantic_score = None

    # Combined score: weighted blend
    if semantic_score is not None:
        # Core ML available — semantic similarity drives the score
        if job_description and required_skills:
            combined = 0.4 * semantic_score + 0.3 * tfidf_score + 0.3 * keyword_result["score"]
        elif required_skills:
            combined = 0.5 * semantic_score + 0.5 * keyword_result["score"]
        else:
            # No job context — semantic similarity to question replaces constant 75.0
            combined = semantic_score
    else:
        # Fallback: original TF-IDF + keyword logic
        if job_description and required_skills:
            combined = 0.4 * tfidf_score + 0.6 * keyword_result["score"]
        elif job_description:
            combined = tfidf_score
        elif required_skills:
            combined = keyword_result["score"]
        else:
            combined = 0.0

    return {
        "tfidf_score": tfidf_score,
        "semantic_score": semantic_score,
        "keyword_match": keyword_result,
        "combined_score": round(combined, 4),
    }
