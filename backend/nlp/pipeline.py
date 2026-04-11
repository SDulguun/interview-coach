"""Orchestrator: combines all NLP modules into a single analysis pipeline."""
from .text_metrics import compute_all_metrics
from .filler_detection import detect_fillers
from .structure_analysis import analyze_structure
from .relevance_scoring import compute_relevance
from .feedback import generate_feedback


class InterviewAnalyzer:
    """Main analysis pipeline for interview responses."""

    def analyze_response(
        self,
        response_text: str,
        question: str = "",
        job_description: str = "",
        required_skills: str = "",
    ) -> dict:
        """Run the full analysis pipeline on an interview response.

        Args:
            response_text: The candidate's answer text.
            question: The interview question (for context).
            job_description: Job listing description for relevance scoring.
            required_skills: Comma-separated required skills from job listing.

        Returns:
            Complete analysis result with metrics, feedback, and scores.
        """
        # 1. Text metrics
        text_metrics = compute_all_metrics(response_text)

        # 2. Filler detection
        filler_result = detect_fillers(response_text)

        # 3. Structure analysis
        structure_result = analyze_structure(response_text)

        # 4. Relevance scoring (always when Core ML available, else only with job context)
        from .coreml_embeddings import is_embedding_model_available

        relevance_result = None
        if job_description or required_skills or is_embedding_model_available():
            relevance_result = compute_relevance(
                response_text, question, job_description, required_skills
            )

        # 5. Generate feedback (with question context for type-aware scoring)
        feedback = generate_feedback(
            text_metrics, filler_result, structure_result, relevance_result,
            question=question,
        )

        return {
            "input": {
                "response_text": response_text,
                "question": question,
                "job_description": job_description[:200] + "..." if len(job_description) > 200 else job_description,
            },
            "metrics": {
                "text": text_metrics,
                "fillers": filler_result,
                "structure": structure_result,
                "relevance": relevance_result,
            },
            "feedback": feedback,
        }
