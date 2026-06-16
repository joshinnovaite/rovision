# BOW-02: Backend
Goal: [[taskindex#Rovision Demo Development]]
Status: done

## Description
Build `app/backend` — a FastAPI + SQLite service that ingests the §17 bundles, stores a catalog
plus per-track summary, and serves the bundle JSON and a **range-seekable** clip to the SPA.
"Upload → process" is reduced to "upload → hydrate from cache", keyed by the **SHA-256 of the
uploaded file bytes**. The backend computes the per-video rollup at ingest and exposes the shared
threshold config so the frontend uses one source of truth.

## Dependencies
- [[BOW-01-Notebook-Export-Extension]] — the bundle format (`meta.json`, `detection_cards.json`,
  `track_cards.json`, `raw.mp4`) is the ingest contract; ST-02.2 consumes ST-01.2's bundle output.

## Subtasks
- [[ST-02.1-Skeleton-Config-Schema-Models]] — FastAPI app, `config.py`, `schema.sql`, models, static layout.
- [[ST-02.2-Ingest-And-Rollup]] — hash, populate videos+tracks, compute rollup, copy bundle, idempotent.
- [[ST-02.3-Read-Endpoints]] — `/videos`, `/{hash}`, `/tracks`, `/detections`, `/config`.
- [[ST-02.4-Range-Seekable-Clip-Serving]] — `/clip` via Starlette FileResponse (206 / Range).
- [[ST-02.5-Upload-Seed-And-Cache-Headers]] — stream-hash upload (hit/miss), seed-on-startup, gzip/cache.

## Context
- [[InferenceOutputs]] — the per-frame/per-track shapes mirrored into SQLite + served as JSON.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — why `tracks` is a table but detections are a blob.
