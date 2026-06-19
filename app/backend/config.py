"""Backend configuration: paths + the per-domain registry (taxonomy, colours,
flag/severity rules).

The taxonomy and thresholds are NOT hardcoded here any more: they live in the
canonical, committed registry at ``rovision/domains.json`` — the single source of
truth shared by the labeller, the notebook, this backend, and (via ``/api/config``)
the frontend. This module loads that registry and exposes a per-domain payload.

Each domain block carries: ``label``, ``mode`` ("defect" | "inventory"),
``all_classes``, ``defect_classes`` (the flag-raising subset; empty for inventory
domains), ``colors``, ``assets`` (the asset-lens map), and ``severity`` (the flag
thresholds, or ``null`` for inventory domains).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv

# --- paths ---------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
BUNDLES_DIR = DATA_DIR / "bundles"          # one sub-dir per pre-computed bundle
DB_PATH = DATA_DIR / "rovision.db"
REPO_ROOT = BACKEND_DIR.parent.parent       # .../app/backend -> .../app -> repo root
DOMAINS_PATH = REPO_ROOT / "rovision" / "domains.json"

# --- Orba CMMS integration (outbound) -----------------------------------------
# The three values the Orba developer owes us live in a gitignored app/backend/.env
# (see .env.example). Loaded here so the secret + assetnum stay server-side only and
# never reach the frontend bundle.
load_dotenv(BACKEND_DIR / ".env")
ORBA_BASE_URL = os.environ.get("ORBA_BASE_URL", "").strip()
ORBA_INGEST_SECRET = os.environ.get("ORBA_INGEST_SECRET", "").strip()
ORBA_ASSETNUM = os.environ.get("ORBA_ASSETNUM", "").strip()

DEFAULT_DOMAIN = "subsea"
SEVERITY_RANK = {"none": 0, "low": 1, "medium": 2, "high": 3}

# Fallback thresholds for domains whose registry `severity` is null (inventory
# domains, which raise no flags anyway — defect_classes is empty). Keeps the
# /api/config payload shape stable so the frontend mirror never sees nulls.
_DEFAULT_SEVERITY = {
    "flag_min_n_frames": 8,
    "flag_min_peak_area": 1500,
    "sev_medium_count": 2,
    "sev_high_count": 4,
    "sev_coverage_bump": 0.05,
}

# Loaded once at import. The registry is small and read-only at runtime.
DOMAINS: dict = json.loads(DOMAINS_PATH.read_text())


def resolve_domain(domain: str | None) -> str:
    """Return a valid domain key, falling back to the default for unknown/missing."""
    return domain if domain in DOMAINS else DEFAULT_DOMAIN


def get_domain(domain: str | None) -> dict:
    """The registry block for `domain` (defaults to subsea)."""
    return DOMAINS[resolve_domain(domain)]


def domains_payload() -> list[dict]:
    """Shape of GET /api/domains — the toggle menu."""
    return [
        {"key": key, "label": d.get("label", key), "mode": d.get("mode", "defect")}
        for key, d in DOMAINS.items()
    ]


def config_payload(domain: str | None = None) -> dict:
    """The shape returned by GET /api/config?domain= (mirrored by the frontend)."""
    key = resolve_domain(domain)
    d = DOMAINS[key]
    sev = d.get("severity") or _DEFAULT_SEVERITY
    return {
        "domain": key,
        "label": d.get("label", key),
        "mode": d.get("mode", "defect"),
        "defect_classes": d.get("defect_classes", []),
        "all_classes": d.get("all_classes", []),
        "colors": d.get("colors", {}),
        "assets": d.get("assets", {}),
        "flag_min_n_frames": sev["flag_min_n_frames"],
        "flag_min_peak_area": sev["flag_min_peak_area"],
        "sev_medium_count": sev["sev_medium_count"],
        "sev_high_count": sev["sev_high_count"],
        "sev_coverage_bump": sev["sev_coverage_bump"],
    }
