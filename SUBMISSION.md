# Capstone Final Submission — AI Interview Coach

**Author:** Dulguun Sukhchuluun
**Course:** Capstone (also Deep Learning Lab 7)
**Date submitted:** 2026-05-13 (deadline 2026-05-14)
**Project:** AI-Assisted Job Interview Practice Platform for Mongolia

---

## Submission deliverables

| Requirement | Link / location |
|---|---|
| **Complete project code (zip)** | This archive — `interview-coach-capstone-submission.zip` |
| **Public GitHub repo** | https://github.com/SDulguun/interview-coach |
| **Demo video (3 min)** | https://youtu.be/HaMPZKoMu3I (also included as `AI-Interview-Coach-Demo.mov` in this submission) |
| **Public deployment URL** | https://interview-coach-sage.vercel.app |
| **Backend health check** | https://interview-coach-api-qe7r.onrender.com/api/health |

---

## How to evaluate

1. **Quickest:** Open the live URL → https://interview-coach-sage.vercel.app → click "Guest mode" → pick a category and difficulty → run a 15-question session in Mongolian.
2. The first request may take ~30 seconds — the free-tier Render backend sleeps after 15 min of inactivity and needs to wake.
3. Watch the demo video for a full feature walkthrough including voice input and LLM-augmented feedback (both local-install features).
4. The complete README inside the zip (and on GitHub) covers setup, architecture, data sources, evaluation methodology, and known limitations.

---

## What's in the cloud demo vs. local install

The deployed demo runs the **rule-based NLP scoring pipeline** end-to-end: text input → 5-dimension scoring (word count, filler words, vocabulary richness/TTR, structure with STAR + action verbs, relevance) → per-question feedback → score history.

Two features are **local-only** because their model files are too large for free-tier hosting:

- **Voice input** uses the fine-tuned `bayartsogt/whisper-large-v2-mn-13` Mongolian Whisper model (~2.9 GB). The full pipeline — `MediaRecorder` in the frontend, `POST /api/analyze/transcribe` on the backend — is wired up and demonstrated in the video.
- **LLM-augmented feedback** uses Anthropic Claude when `ANTHROPIC_API_KEY` is set. Without the key, the same screen renders rule-based templates (also validated against a 20-answer gold standard — see `notebooks/evaluation.ipynb`).

Setup for both is in the root `README.md` under "Setup / Running Locally".

---

## Tech stack summary

- **Frontend:** React 19 + Vite, vanilla CSS, Framer Motion, Chart.js, cmdk command palette
- **Backend:** FastAPI (Python 3.11), Uvicorn
- **STT:** `faster-whisper` (Mongolian fine-tune)
- **TTS:** Microsoft Edge Neural Voices (`mn-MN-YesuiNeural`)
- **Embeddings:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` → Core ML
- **Data:** 489 interview Q&A pairs from 18 Mongolian companies (Unitel, MCS, IT Zone, Coca-Cola, Paul Bakery, and more)
- **LLM (optional):** Anthropic Claude (Sonnet)
- **Hosting:** Vercel (frontend) + Render (backend, free tier)

---

## Repo layout (highlights)

```
interview-coach/
├── README.md              Full rubric-template documentation
├── render.yaml            Render deploy blueprint
├── backend/               FastAPI app, NLP pipeline, routers, 489-pair dataset
│   ├── main.py
│   ├── nlp/               5-dimension scoring + Core ML + optional LLM
│   ├── routers/           7 API endpoints
│   └── data/processed/mn/ 18 CSV files
├── frontend/              React 19 + Vite SPA
│   ├── src/components/    UI components + scoped CSS
│   ├── src/api.js         Axios client (env-driven base URL)
│   └── vercel.json
├── notebooks/
│   └── evaluation.ipynb   Gold-standard validation, baselines, error analysis
└── docs/screenshots/      6 product screenshots referenced by the README
```

---

Thank you for reviewing the project.
