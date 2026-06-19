"""Orba CMMS integration — turn Subsea work-order findings into Service Requests.

This is the server-side port of ``orba/orbaAdapter.ts`` (kept as the canonical
contract reference, not imported). The browser never talks to Orba directly:
the frontend POSTs findings to our own ``/api/orba/service-requests`` and this
module forwards them to the live Orba URL. That keeps the shared secret in a
server env var (never shipped in the JS bundle) and avoids browser CORS.

Contract: see ``orba/INTEGRATION_CONTRACT.md``. One Service Request per finding;
severity ``none`` is skipped (no SR filed).
"""
from __future__ import annotations

from typing import Optional

import httpx

# --- severity → Orba priority (1-9). Frozen with the team. ---------------------
# high=2, medium=4, low=6, none=skip. None means "do not file an SR".
_PRIORITY_BY_SEVERITY = {"high": 2, "medium": 4, "low": 6, "none": None}


def severity_to_priority(severity: str) -> Optional[int]:
    """Map a Subsea severity to an Orba 1-9 priority. None = do not file."""
    return _PRIORITY_BY_SEVERITY.get(severity, 6)


def _truncate(s: str, max_len: int) -> str:
    return s if len(s) <= max_len else s[: max_len - 1] + "…"


def finding_to_service_request(
    finding: dict,
    assetnum: str,
    video_id: Optional[str] = None,
) -> Optional[dict]:
    """Build the Orba SR body from a finding. None for findings not to be filed."""
    priority = severity_to_priority(finding["severity"])
    if priority is None:  # skip 'none'
        return None

    class_name = finding["className"]
    cls = class_name[:1].upper() + class_name[1:]
    description = _truncate(f"{cls} detected — {finding['action']}", 100)

    long_parts = [
        "Auto-filed by Subsea defect detection.",
        f"Defect class: {class_name}.",
        f"Severity: {finding['severity']}.",
        f"Instances: {finding['count']}.",
        f"Peak frame coverage: {finding['peakCoverage'] * 100:.1f}%.",
    ]
    if video_id:
        long_parts.append(f"Video: {video_id}.")

    return {
        "description": description,
        "longdescription": " ".join(long_parts),
        "assetnum": assetnum,
        "priority": priority,
    }


def _post_service_request(
    client: httpx.Client,
    body: dict,
    base_url: str,
    secret: Optional[str],
) -> dict:
    """POST one SR; return a normalized result dict (never raises for HTTP errors)."""
    headers = {"Content-Type": "application/json"}
    if secret:
        headers["Authorization"] = f"Bearer {secret}"

    res = client.post(
        f"{base_url.rstrip('/')}/api/service-requests",
        json=body,
        headers=headers,
    )

    payload = None
    try:
        payload = res.json()
    except ValueError:
        payload = None  # non-JSON error body

    if res.status_code >= 400:
        error = None
        if isinstance(payload, dict):
            error = payload.get("error") or payload.get("message")
        return {"ok": False, "status": res.status_code, "error": error or f"HTTP {res.status_code}"}

    srticknum = None
    if isinstance(payload, dict) and isinstance(payload.get("data"), dict):
        srticknum = payload["data"].get("srticknum")
    return {"ok": True, "status": res.status_code, "srticknum": srticknum}


def file_findings_to_orba(
    findings: list[dict],
    *,
    base_url: str,
    secret: Optional[str],
    assetnum: str,
    video_id: Optional[str] = None,
) -> list[dict]:
    """File findings to Orba as Service Requests, sequentially.

    Sequential (not parallel) so Orba's autokey SR-#### generation stays clean and
    the demo's request log is readable. Returns a per-finding result list; a single
    failure does not abort the batch.
    """
    if not assetnum:
        raise ValueError("orba: assetnum is required (a real Orba assetnum at site BEDFORD).")

    results: list[dict] = []
    with httpx.Client(timeout=15.0) as client:
        for finding in findings:
            class_name = finding.get("className", "?")
            body = finding_to_service_request(finding, assetnum, video_id)
            if body is None:
                results.append(
                    {"className": class_name, "ok": True, "error": "skipped (severity none)"}
                )
                continue
            try:
                r = _post_service_request(client, body, base_url, secret)
                results.append({"className": class_name, **r})
            except httpx.HTTPError as e:
                results.append({"className": class_name, "ok": False, "error": str(e)})
    return results
