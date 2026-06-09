"""Ingest a pre-computed §17 bundle into the catalog.

A bundle directory contains: meta.json, track_cards.json, detection_cards.json, raw.mp4.
The video's identity (cache key) is sha256(raw.mp4). Ingest is idempotent on that hash.
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from . import config
from .db import get_conn, init_db
from .rollup import compute_rollup


def sha256_file(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def ingest_bundle(bundle_dir: Path) -> str | None:
    """Ingest one bundle dir. Returns the video hash, or None if incomplete."""
    bundle_dir = bundle_dir.resolve()
    meta_path = bundle_dir / "meta.json"
    tracks_path = bundle_dir / "track_cards.json"
    raw_path = bundle_dir / "raw.mp4"
    if not (meta_path.exists() and tracks_path.exists() and raw_path.exists()):
        print(f"[ingest] skip {bundle_dir.name}: missing meta/tracks/raw.mp4")
        return None

    meta = json.loads(meta_path.read_text())
    tracks = json.loads(tracks_path.read_text())
    video_hash = sha256_file(raw_path)

    enc_fps = int(meta.get("enc_fps") or round(meta.get("fps", 30)))
    n_frames = int(meta.get("n_frames", 0))
    width, height = int(meta.get("width", 0)), int(meta.get("height", 0))
    duration_sec = round(n_frames / enc_fps, 3) if enc_fps else None
    flag_count, max_severity = compute_rollup(tracks, width, height)

    with get_conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO videos
               (hash, source_video, asset, fps, enc_fps, width, height, n_frames,
                start_frame, refine_every, duration_sec, flag_count, max_severity,
                bundle_dir, processed_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                video_hash, meta.get("source_video"), meta.get("asset"),
                meta.get("fps"), enc_fps, width, height, n_frames,
                meta.get("start_frame"), meta.get("refine_every"), duration_sec,
                flag_count, max_severity, str(bundle_dir),
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
            ),
        )
        conn.execute("DELETE FROM tracks WHERE hash = ?", (video_hash,))
        conn.executemany(
            """INSERT INTO tracks
               (hash, track_id, class, first_frame, last_frame, n_frames, peak_conf, peak_area_px)
               VALUES (?,?,?,?,?,?,?,?)""",
            [
                (video_hash, t["track_id"], t["class"], t["first_frame"],
                 t["last_frame"], t["n_frames"], t.get("peak_conf"), t.get("peak_area_px"))
                for t in tracks
            ],
        )
    print(f"[ingest] {bundle_dir.name}: hash={video_hash[:12]}… "
          f"tracks={len(tracks)} flags={flag_count} severity={max_severity}")
    return video_hash


def ingest_all() -> list[str]:
    """Ingest every bundle dir under BUNDLES_DIR. Returns list of hashes."""
    init_db()
    hashes = []
    if not config.BUNDLES_DIR.exists():
        return hashes
    for d in sorted(p for p in config.BUNDLES_DIR.iterdir() if p.is_dir()):
        h = ingest_bundle(d)
        if h:
            hashes.append(h)
    return hashes


if __name__ == "__main__":
    init_db()
    if len(sys.argv) > 1:
        ingest_bundle(Path(sys.argv[1]))
    else:
        hashes = ingest_all()
        print(f"[ingest] done: {len(hashes)} bundle(s) in catalog")
