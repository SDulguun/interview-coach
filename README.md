# AI Interview Coach

**AI-Assisted Job Interview Practice Platform for Mongolia**

A web-based platform where users practice mock job interviews entirely in Mongolian. Users hear questions spoken aloud, respond by voice or text, and receive detailed NLP-based feedback on their answers across five scoring dimensions.

## Features

- **10 Job Categories** — Banking, Sales, Mining, Construction, Manufacturing, Education, IT, Healthcare, Marketing, Admin/HR with category-specific questions
- **Speech-to-Text** — Fine-tuned Mongolian Whisper model (`bayartsogt/whisper-large-v2-mn-13`) for voice input
- **Text-to-Speech** — Microsoft Edge TTS with Mongolian voice for question playback
- **NLP Scoring Pipeline** — Rule-based analysis across 5 dimensions:
  - Word Count (response length adequacy)
  - Filler Words (Mongolian + English filler detection)
  - Vocabulary Richness (Type-Token Ratio)
  - Structure (STAR method detection + action verbs, question-type-aware)
  - Relevance (TF-IDF cosine similarity + skill keyword matching)
- **Hybrid Question Generation** — Curated opening/closing + CSV-matched questions from 489 real interview Q&A pairs + template fallback
- **Resume Parsing** — Extract skills from uploaded PDF/DOCX resumes
- **Bilingual Interface** — Full Mongolian/English language toggle
- **Progress Tracking** — Score history with Chart.js trend visualization

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | FastAPI (Python) |
| STT | faster-whisper (CTranslate2, float16) |
| TTS | edge-tts (mn-MN-YesuiNeural) |
| NLP | Custom rule-based pipeline (scikit-learn TF-IDF) |
| Data | 489 Q&A pairs from 18 Mongolian companies |
| Charts | Chart.js + react-chartjs-2 |

## Project Structure

```
interview-coach/
├── backend/
│   ├── main.py              # FastAPI app + CORS
│   ├── config.py             # Paths, constants
│   ├── whisper_service.py    # STT model loading
│   ├── nlp/
│   │   ├── pipeline.py       # InterviewAnalyzer (main orchestrator)
│   │   ├── feedback.py       # Score → feedback generation
│   │   ├── text_metrics.py   # Word count, TTR
│   │   ├── filler_detection.py
│   │   ├── structure_analysis.py  # STAR + action verbs
│   │   └── relevance_scoring.py   # TF-IDF + keyword matching
│   ├── routers/
│   │   ├── analyze.py        # /api/analyze endpoints
│   │   ├── questions.py      # /api/questions + hybrid generation
│   │   ├── resume.py         # /api/resume parsing
│   │   ├── tts.py            # /api/tts generation
│   │   └── jobs.py           # /api/jobs listings
│   └── data/processed/mn/    # 18 CSV files with interview Q&A
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Phase management (welcome→setup→interview→results)
│   │   ├── App.css           # All styles
│   │   ├── api.js            # Axios API client
│   │   ├── lang.jsx          # i18n context (75+ keys, MN/EN)
│   │   └── components/
│   │       ├── WelcomePage.jsx
│   │       ├── Layout.jsx         # Sidebar + topbar
│   │       ├── Dashboard.jsx      # Setup view
│   │       ├── JobSelector.jsx    # Category cards
│   │       ├── InterviewSession.jsx
│   │       ├── SessionResults.jsx
│   │       ├── HistoryView.jsx
│   │       └── ...
│   └── public/audio/          # Pre-generated question audio
└── notebooks/
    └── pipeline_demo.ipynb    # NLP pipeline walkthrough
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
```

**Whisper model** (required for STT):
```bash
# Download the fine-tuned Mongolian Whisper model (~2.9GB)
ct2-opus-converter --model bayartsogt/whisper-large-v2-mn-13 \
  --output_dir models/whisper-mn --quantization float16
```

**Start the server:**
```bash
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze/text` | POST | Analyze a single text response |
| `/api/analyze/batch` | POST | Analyze full interview session |
| `/api/analyze/transcribe` | POST | Transcribe audio (Whisper STT) |
| `/api/questions/generate` | POST | Generate hybrid questions for category |
| `/api/questions/sample` | GET | Get curated sample questions |
| `/api/resume/parse` | POST | Extract skills from PDF/DOCX |
| `/api/tts/generate` | POST | Generate Mongolian TTS audio |
| `/api/health` | GET | Health check |
| `/docs` | GET | Interactive API documentation |

## Dataset

- **489 interview Q&A pairs** from 18 Mongolian companies
- Sources: Unitel, MCS, IT Zone, Coca-Cola, Paul Bakery, Metagro, Premier Group, and more
- Fields: company, question, answer, candidate name, timestamp
- Filtered to remove evaluator meta-questions

## Evaluation

See [`notebooks/evaluation.ipynb`](notebooks/evaluation.ipynb) for full validation:

- **Gold standard**: 20 hand-annotated answers across 4 score quartiles; system scores correlate significantly with human judgment (p < 0.05) and achieve the lowest MAE across all methods tested
- **Baselines**: 5-dimension pipeline compared against random, word-count-only, and WC+filler baselines
- **Coverage**: 471 Q&A pairs from 15 company sources across 6 job categories
- **Error analysis**: Score floor effects and meta-comment false positives identified with concrete fixes
- **Question type validation**: ANOVA confirms statistically significant score differences across introduction/behavioral/motivation/general types
- **Weight sensitivity**: 4 weighting schemes compared; chosen weights are competitive

## Limitations

- **Rule-based NLP** — Scoring uses heuristic thresholds; validated against 20-answer gold standard (see evaluation notebook).
- **Score floor effect** — System minimum ~55 due to dimension baselines; cannot penalize very poor answers enough.
- **Mongolian tokenization** — Whitespace-based only; no morphological analysis.
- **STAR detection** — Keyword matching, not semantic understanding.
- **STT accuracy** — ~20% word error rate on Mongolian speech (model limitation).
- **No persistent storage** — Session history stored in browser localStorage only.
- **Hardcoded skills list** — Resume skill extraction limited to ~60 predefined skills.

## Next Steps

- ~~Validate NLP scores against human-annotated interview ratings~~ (done — see evaluation notebook)
- Expand gold standard to 50+ answers with multiple annotators for inter-annotator agreement
- Integrate Google Cloud Speech API for improved STT accuracy
- Add user accounts with persistent cloud storage
- Expand dataset with more industry-specific Q&A pairs
- Implement semantic similarity for relevance scoring (sentence embeddings)
