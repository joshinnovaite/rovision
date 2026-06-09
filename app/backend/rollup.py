"""Flag qualification + severity rollup.

This is the canonical Python implementation of the rule the frontend mirrors in
TypeScript (lib/severity.ts). The backend uses it only to denormalise a per-video
`flag_count` + `max_severity` for the library tiles; the frontend recomputes live
to honour omitted-classes / asset filters.
"""
from __future__ import annotations

from . import config


def is_flag(track: dict, frame_area: int | None = None) -> bool:
    """A track qualifies as a flag if it's a defect class and clears the floor."""
    if track["class"] not in config.DEFECT_CLASSES:
        return False
    peak_area = track.get("peak_area_px") or 0
    return (
        track.get("n_frames", 0) >= config.FLAG_MIN_N_FRAMES
        or peak_area >= config.FLAG_MIN_PEAK_AREA
    )


def _peak_coverage(track: dict, frame_area: int) -> float:
    peak_area = track.get("peak_area_px") or 0
    return peak_area / frame_area if frame_area else 0.0


def severity_for_count(count: int, has_big: bool) -> str:
    if count <= 0:
        return "none"
    if count >= config.SEV_HIGH_COUNT:
        tier = "high"
    elif count >= config.SEV_MEDIUM_COUNT:
        tier = "medium"
    else:
        tier = "low"
    if has_big:  # bump one tier
        tier = {"low": "medium", "medium": "high", "high": "high"}[tier]
    return tier


def compute_rollup(tracks: list[dict], width: int, height: int) -> tuple[int, str]:
    """Return (flag_count, max_severity) over all qualifying defect instances."""
    frame_area = max(1, (width or 0) * (height or 0))
    flags = [t for t in tracks if is_flag(t, frame_area)]
    flag_count = len(flags)

    by_class: dict[str, list[dict]] = {}
    for t in flags:
        by_class.setdefault(t["class"], []).append(t)

    max_rank, max_sev = 0, "none"
    for cls, group in by_class.items():
        has_big = any(_peak_coverage(t, frame_area) >= config.SEV_COVERAGE_BUMP for t in group)
        sev = severity_for_count(len(group), has_big)
        if config.SEVERITY_RANK[sev] > max_rank:
            max_rank, max_sev = config.SEVERITY_RANK[sev], sev

    return flag_count, max_sev
