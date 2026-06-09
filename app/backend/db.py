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
