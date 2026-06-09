"""Backend configuration: paths, the defect taxonomy, and the flag/severity rules.

These thresholds are the single source of truth for the per-video *rollup* the backend
computes for library tiles. They are exposed verbatim via `GET /api/config` so the
frontend's live (filter-aware) flag/severity/work-order logic uses the same numbers.
"""
from __future__ import annotations

from pathlib import Path

# --- paths ---------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
BUNDLES_DIR = DATA_DIR / "bundles"          # one sub-dir per pre-computed bundle
DB_PATH = DATA_DIR / "rovision.db"

# --- taxonomy ------------------------------------------------------------------
# Classes that can raise a flag / work order. The 6 defects plus dropped_object
# (the client's "foreign objects"). Everything else is context (artefacts).
DEFECT_CLASSES = [
    "corrosion",
    "coating_breakdown",
    "surface_deposit",
    "marine_growth",
    "trash_rack_blockage",
    "seal_joint_degradation",
    "dropped_object",
]

# Full 15-class taxonomy (order matters only for display grouping).
ALL_CLASSES = [
    "corrosion", "coating_breakdown", "surface_deposit", "marine_growth",
    "trash_rack_blockage", "seal_joint_degradation",
    "pipework", "ladder", "outlet_inlet", "valve_mixer", "fish", "coral",
    "seagrass", "rov_manipulator", "dropped_object",
]

# --- flag qualification (flicker-proof) ----------------------------------------
# A flag is a *tracked instance* (ByteTrack already collapses flicker into one
# track and drops sub-MIN_TRACK_LEN blips at source). On top of that, a track
# only qualifies as a flag if it persists AND/OR is large enough:
FLAG_MIN_N_FRAMES = 8        # must be seen on >= this many frames
FLAG_MIN_PEAK_AREA = 1500    # OR reach >= this peak mask area (px)

# --- severity tiers ------------------------------------------------------------
# Severity of a class = a function of how many qualifying instances it has,
# bumped one tier if any instance's peak coverage is large.
SEV_MEDIUM_COUNT = 2         # >= this many qualifying instances -> Medium
SEV_HIGH_COUNT = 4           # >= this many -> High
SEV_COVERAGE_BUMP = 0.05     # any instance with peak coverage >= this bumps one tier

SEVERITY_RANK = {"none": 0, "low": 1, "medium": 2, "high": 3}


def config_payload() -> dict:
    """The shape returned by GET /api/config (mirrored by the frontend)."""
    return {
        "defect_classes": DEFECT_CLASSES,
        "all_classes": ALL_CLASSES,
        "flag_min_n_frames": FLAG_MIN_N_FRAMES,
        "flag_min_peak_area": FLAG_MIN_PEAK_AREA,
        "sev_medium_count": SEV_MEDIUM_COUNT,
        "sev_high_count": SEV_HIGH_COUNT,
        "sev_coverage_bump": SEV_COVERAGE_BUMP,
    }
