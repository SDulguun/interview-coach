# interview-coach / frontend

React 19 + Vite single-page app for the AI Interview Coach platform.

**Full project documentation, setup, and live demo links are in the [root README](../README.md).**

## Quick commands

```bash
npm install        # install deps
cp .env.example .env
npm run dev        # http://localhost:5173 — Vite dev server
npm run build      # production build into dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint
```

The dev server expects the FastAPI backend at `http://localhost:8000`. Override with `VITE_API_BASE_URL` in `.env`.
