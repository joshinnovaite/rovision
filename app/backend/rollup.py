"""Flag qualification + severity rollup.

This is the canonical Python implementation of the rule the frontend mirrors in
TypeScript (lib/severity.ts). The backend uses it only to denormalise a per-video
`flag_count` + `max_severity` for the library tiles; the frontend recomputes live
to honour omitted-classes / asset filters.

The thresholds + defect set are per-domain (see config.config_payload). Inventory
domains have an empty defect set, so every track fails `is_flag` → flag_count 0,
max_severity "none" (the frontend relabels those tiles for inventory mode).
"""
from __future__ import annotations

from . import config


def is_flag(track: dict, cfg: dict) -> bool:
    """A track qualifies as a flag if it's a defect class and clears the floor."""
    if track["class"] not in cfg["defect_classes"]:
        return False
    peak_area = track.get("peak_area_px") or 0
    return (
        track.get("n_frames", 0) >= cfg["flag_min_n_frames"]
        or peak_area >= cfg["flag_min_peak_area"]
    )


def _peak_coverage(track: dict, frame_area: int) -> float:
    peak_area = track.get("peak_area_px") or 0
    return peak_area / frame_area if frame_area else 0.0


def severity_for_count(count: int, has_big: bool, cfg: dict) -> str:
    if count <= 0:
        return "none"
    if count >= cfg["sev_high_count"]:
        tier = "high"
    elif count >= cfg["sev_medium_count"]:
        tier = "medium"
    else:
        tier = "low"
    if has_big:  # bump one tier
        tier = {"low": "medium", "medium": "high", "high": "high"}[tier]
    return tier


def compute_rollup(
    tracks: list[dict], width: int, height: int, domain: str | None = None
) -> tuple[int, str]:
    """Return (flag_count, max_severity) over all qualifying defect instances."""
    cfg = config.config_payload(domain)
    frame_area = max(1, (width or 0) * (height or 0))
    flags = [t for t in tracks if is_flag(t, cfg)]
    flag_count = len(flags)

    by_class: dict[str, list[dict]] = {}
    for t in flags:
        by_class.setdefault(t["class"], []).append(t)

    max_rank, max_sev = 0, "none"
    for cls, group in by_class.items():
        has_big = any(_peak_coverage(t, frame_area) >= cfg["sev_coverage_bump"] for t in group)
        sev = severity_for_count(len(group), has_big, cfg)
        if config.SEVERITY_RANK[sev] > max_rank:
            max_rank, max_sev = config.SEVERITY_RANK[sev], sev

    return flag_count, max_sev
