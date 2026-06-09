"""Rovision demo backend — FastAPI.

Serves the pre-computed inference bundles to the SPA:
  - catalog + per-track summaries (SQLite),
  - per-frame detection geometry (the bundle JSON blob),
  - the raw clip with HTTP range support (for seeking),
  - SHA-256 upload dedup (cache hit/miss).

Run (dev):  uvicorn app.backend.main:app --reload --port 8000
"""
from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse

from . import config
from .db import get_conn, init_db
from .ingest import ingest_all

app = FastAPI(title="Rovision demo backend")

# The Vite dev server proxies /api, but allow direct cross-origin too.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.on_event("startup")
def _startup() -> None:
    init_db()
    hashes = ingest_all()  # seed: ingest any bundle dirs not yet catalogued
    print(f"[startup] catalog ready: {len(hashes)} bundle(s)")


# --- helpers -------------------------------------------------------------------
def _video_row(video_hash: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM videos WHERE hash = ?", (video_hash,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="video not found")
    return row


def _bundle_path(video_hash: str, name: str) -> Path:
    row = _video_row(video_hash)
    p = Path(row["bundle_dir"]) / name
    if not p.exists():
        raise HTTPException(status_code=404, detail=f"{name} not found")
    return p


# --- routes --------------------------------------------------------------------
@app.get("/api/config")
def get_config():
    return config.config_payload()


@app.get("/api/videos")
def list_videos():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM videos ORDER BY processed_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/videos/{video_hash}")
def get_video(video_hash: str):
    row = _video_row(video_hash)
    out = dict(row)
    out["classes"] = config.ALL_CLASSES
    return out


@app.get("/api/videos/{video_hash}/tracks")
def get_tracks(video_hash: str):
    _video_row(video_hash)  # 404 if unknown
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT track_id, class, first_frame, last_frame, n_frames, peak_conf, peak_area_px "
            "FROM tracks WHERE hash = ? ORDER BY first_frame, track_id",
            (video_hash,),
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/videos/{video_hash}/detections")
def get_detections(video_hash: str):
    path = _bundle_path(video_hash, "detection_cards.json")
    return FileResponse(
        path,
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@app.get("/api/videos/{video_hash}/clip")
def get_clip(video_hash: str, variant: str = "raw"):
    name = {"raw": "raw.mp4", "overlay": "internal_assets_demo.mp4"}.get(variant)
    if name is None:
        raise HTTPException(status_code=400, detail="variant must be 'raw' or 'overlay'")
    path = _bundle_path(video_hash, name)
    # Starlette's FileResponse honours the Range header (returns 206) — required
    # for browser <video> seeking and the timeline scroll-scrub.
    return FileResponse(path, media_type="video/mp4")


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    """Stream the uploaded bytes through sha256; report cache hit/miss.

    We never persist the upload — for a known clip its hash matches a seeded
    bundle and we replay that; processing requires a GPU and is done offline.
    """
    h = hashlib.sha256()
    while True:
        chunk = await file.read(1 << 20)
        if not chunk:
            break
        h.update(chunk)
    digest = h.hexdigest()

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM videos WHERE hash = ?", (digest,)).fetchone()
    if row is not None:
        return {"status": "hit", "hash": digest, "video": dict(row)}
    return JSONResponse(
        {"status": "miss", "hash": digest,
         "detail": "No cached results for this video. Process it offline (Colab §17) first."},
        status_code=202,
    )
