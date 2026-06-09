# Rovision demo app

A replay/visualization SPA over the pre-computed §17 inference bundles. Two processes.

## Backend — FastAPI, serves the bundles (catalog, detections, range-seekable clip)

```bash
# from the repo root
app/.venv/bin/python -m uvicorn app.backend.main:app --reload --port 8000
```

On startup it ingests every bundle directory under `app/backend/data/bundles/<name>/`
(each containing `meta.json`, `detection_cards.json`, `track_cards.json`, `raw.mp4`).
To add a video: drop a new §17 bundle dir there and restart (or re-run
`app/.venv/bin/python -m app.backend.ingest`).

First-time setup:
```bash
python3 -m venv app/.venv
app/.venv/bin/pip install -r app/backend/requirements.txt
```

## Frontend — Vite + React + TS SPA (HMR = livereload)

```bash
cd app/frontend
npm install        # first time only
npm run dev        # http://localhost:5173
```

`/api/*` is proxied to the backend on :8000, so run both. Open
<http://localhost:5173> and you'll see the processed library.

## Layout
- `app/backend/` — FastAPI app, SQLite catalog, ingest. `data/` is gitignored (large clips).
- `app/frontend/src/` — `types/`, `lib/` (api, severity, work orders, frame indices, asset config),
  `state/` (Zustand stores), `components/`, `screens/`.
