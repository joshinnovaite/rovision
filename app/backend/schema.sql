-- Catalog of processed videos + their per-instance tracks.
-- Per-frame detection geometry is NOT stored here: it is served whole as the
-- bundle's detection_cards.json (the player needs the full index to scrub).

CREATE TABLE IF NOT EXISTS videos (
    hash          TEXT PRIMARY KEY,   -- sha256 of raw.mp4 (the cache key)
    source_video  TEXT,               -- original filename from meta.json
    asset         TEXT,               -- asset slug (metadata)
    fps           REAL,
    enc_fps       INTEGER,            -- fps ffmpeg encoded at; frame = round(t*enc_fps)
    width         INTEGER,
    height        INTEGER,
    n_frames      INTEGER,
    start_frame   INTEGER,            -- provenance: original-video index of clip frame 0
    refine_every  INTEGER,
    duration_sec  REAL,
    flag_count    INTEGER,            -- rollup: qualifying defect instances
    max_severity  TEXT,               -- rollup: none|low|medium|high
    bundle_dir    TEXT,               -- absolute path to the bundle directory
    processed_at  TEXT
);

CREATE TABLE IF NOT EXISTS tracks (
    hash          TEXT,
    track_id      INTEGER,
    class         TEXT,
    first_frame   INTEGER,
    last_frame    INTEGER,
    n_frames      INTEGER,
    peak_conf     REAL,
    peak_area_px  INTEGER,
    PRIMARY KEY (hash, track_id),
    FOREIGN KEY (hash) REFERENCES videos(hash) ON DELETE CASCADE
);
