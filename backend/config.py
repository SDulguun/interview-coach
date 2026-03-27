"""Configuration constants for the Interview Coach backend."""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
MN_QA_DIR = os.path.join(DATA_DIR, "mn")
JOB_LISTINGS_CSV = os.path.join(DATA_DIR, "job_listings_processed.csv")
TRANSCRIPTS_CSV = os.path.join(DATA_DIR, "transcripts_processed.csv")
DB_PATH = os.path.join(DATA_DIR, "interview_coach.db")

# NLP benchmarks — adjusted for realistic interview answers
BENCHMARKS = {
    "word_count_median": 45,
    "word_count_q1": 20,
    "word_count_q3": 80,
    "ttr_mean": 0.88,
    "ttr_std": 0.06,
    "filler_count_mean": 0.34,
    "avg_word_len_mean": 5.98,
    "sentence_count_median": 4,
}

# Score weights — balanced, relevance lower when no job context
SCORE_WEIGHTS = {
    "word_count": 0.15,
    "filler": 0.15,
    "ttr": 0.15,
    "structure": 0.30,
    "relevance": 0.25,
}

# Whisper model settings
WHISPER_MODEL = os.environ.get(
    "WHISPER_MODEL", os.path.join(BASE_DIR, "models", "whisper-mn")
)

# Mongolian initial prompt — anchors Whisper's decoder to Cyrillic Mongolian output
WHISPER_INITIAL_PROMPT = "Энэ бол ажлын ярилцлагын хариулт юм. Би өөрийн туршлага болон ур чадварын талаар ярих болно."
