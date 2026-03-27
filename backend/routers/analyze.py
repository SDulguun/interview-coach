"""Analysis endpoints: text and audio input."""
import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from ..nlp.pipeline import InterviewAnalyzer

router = APIRouter(prefix="/api/analyze", tags=["analyze"])
analyzer = InterviewAnalyzer()


class TextAnalysisRequest(BaseModel):
    text: str
    question: str = ""
    job_id: int | None = None
    job_description: str = ""
    required_skills: str = ""


class AnswerItem(BaseModel):
    question: str
    text: str


class BatchAnalysisRequest(BaseModel):
    answers: list[AnswerItem]
    required_skills: str = ""
    total_duration_seconds: float = 0


@router.post("/text")
async def analyze_text(req: TextAnalysisRequest):
    """Analyze a text interview response."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # If job_id provided, look up job details
    job_desc = req.job_description
    req_skills = req.required_skills

    if req.job_id and not job_desc:
        from .jobs import get_job_by_id
        job = await get_job_by_id(req.job_id)
        if job:
            job_desc = job.get("description", "")
            req_skills = job.get("required_skills", "")

    result = analyzer.analyze_response(
        response_text=req.text,
        question=req.question,
        job_description=job_desc,
        required_skills=req_skills,
    )
    return result


@router.post("/transcribe")
async def transcribe_only(
    audio: UploadFile = File(...),
):
    """Transcribe audio without running NLP analysis."""
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from ..whisper_service import transcribe_audio
        transcription = transcribe_audio(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        os.unlink(tmp_path)

    if not transcription.strip():
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    return {"transcription": transcription}


@router.post("/audio")
async def analyze_audio(
    audio: UploadFile = File(...),
    question: str = Form(""),
    job_id: int | None = Form(None),
    job_description: str = Form(""),
    required_skills: str = Form(""),
):
    """Transcribe audio and analyze the response."""
    # Save uploaded audio to temp file
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Import whisper service
        from ..whisper_service import transcribe_audio
        transcription = transcribe_audio(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        os.unlink(tmp_path)

    if not transcription.strip():
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    # Look up job details if job_id provided
    job_desc = job_description
    req_skills = required_skills

    if job_id and not job_desc:
        from .jobs import get_job_by_id
        job = await get_job_by_id(job_id)
        if job:
            job_desc = job.get("description", "")
            req_skills = job.get("required_skills", "")

    result = analyzer.analyze_response(
        response_text=transcription,
        question=question,
        job_description=job_desc,
        required_skills=req_skills,
    )
    result["transcription"] = transcription
    return result


@router.post("/batch")
async def analyze_batch(req: BatchAnalysisRequest):
    """Analyze multiple interview answers from a session."""
    if not req.answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    per_question = []
    for item in req.answers:
        if not item.text.strip():
            per_question.append(None)
            continue
        result = analyzer.analyze_response(
            response_text=item.text,
            question=item.question,
            required_skills=req.required_skills,
        )
        per_question.append(result)

    # Aggregate scores from non-null results
    valid = [r for r in per_question if r is not None]
    if not valid:
        raise HTTPException(status_code=400, detail="No valid answers to analyze")

    dim_keys = ["word_count", "filler", "ttr", "structure", "relevance"]
    avg_dims = {}
    for key in dim_keys:
        scores = [r["feedback"]["dimension_scores"][key] for r in valid]
        avg_dims[key] = round(sum(scores) / len(scores), 1)

    overall_scores = [r["feedback"]["overall_score"] for r in valid]
    avg_overall = round(sum(overall_scores) / len(overall_scores), 1)

    # Generate aggregate feedback from averaged metrics (avoids contradictions)
    from ..nlp.feedback import generate_feedback
    n = len(valid)
    avg_text_metrics = {
        "word_count": round(sum(r["metrics"]["text"]["word_count"] for r in valid) / n),
        "ttr": sum(r["metrics"]["text"]["ttr"] for r in valid) / n,
    }
    avg_filler = {
        "total_count": round(sum(r["metrics"]["fillers"]["total_count"] for r in valid) / n),
    }
    avg_structure = {
        "action_verbs": {
            "count": round(sum(r["metrics"]["structure"]["action_verbs"]["count"] for r in valid) / n),
        },
        "star_method": {
            "score": sum(r["metrics"]["structure"]["star_method"]["score"] for r in valid) / n,
        },
    }
    # Use first valid relevance result (same job for all questions)
    avg_relevance = next((r["metrics"]["relevance"] for r in valid if r["metrics"]["relevance"]), None)

    agg_feedback = generate_feedback(avg_text_metrics, avg_filler, avg_structure, avg_relevance)

    return {
        "per_question": per_question,
        "aggregate": {
            "overall_score": avg_overall,
            "dimension_scores": avg_dims,
            "strengths": agg_feedback["strengths"],
            "improvements": agg_feedback["improvements"],
            "suggestions": agg_feedback["suggestions"],
        },
        "session": {
            "total_questions": len(req.answers),
            "answered": len(valid),
            "total_duration_seconds": req.total_duration_seconds,
        },
    }
