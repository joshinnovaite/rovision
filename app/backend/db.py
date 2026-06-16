"""SQLite connection + schema initialisation."""
from __future__ import annotations

import sqlite3

from . import config


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    schema = (config.BACKEND_DIR / "schema.sql").read_text()
    with get_conn() as conn:
        conn.executescript(schema)
        _migrate(conn)


def _migrate(conn: sqlite3.Connection) -> None:
    """In-place upgrades for DBs created before a schema change.

    `CREATE TABLE IF NOT EXISTS` won't add columns to an existing table, so the
    multi-domain `videos.domain` column is added here for pre-existing catalogs;
    fresh DBs already have it from schema.sql. Old rows default to 'subsea'.
    """
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(videos)")}
    if "domain" not in cols:
        conn.execute(
            "ALTER TABLE videos ADD COLUMN domain TEXT NOT NULL DEFAULT 'subsea'"
        )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_videos_domain ON videos(domain)")
