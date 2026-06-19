# BOW-11: Orba CMMS Service-Request Integration

Goal: [[taskindex#External integrations — CMMS (Orba)]]
Status: in-progress
Progress: implementation done and verified against a local stub; live demo blocked on three runtime values still owed by the Orba developer (ST-11.2).

## Description
File the Subsea app's suggested work orders into **Orba** (external CMMS) as **Service Requests** — the app's
first outbound-internet integration. The POST originates from our FastAPI backend (same-origin
`/api/orba/service-requests` → live Orba URL), not the browser, to keep the shared secret server-side and
preserve the single-origin proxy. Severity→priority mapping, one-SR-per-finding sequential sending, a single
hardcoded `assetnum`, and an explicit "Send to Orba" button with a per-video dedup guard are all frozen in
[[DR-020-Orba-CMMS-Integration-Server-Side-Proxy]].

## Dependencies
- [[BOW-02-Backend]] — the single-origin `/api` proxy this extends server-side.
- [[ST-04.4-Work-Order-List]] — the work-order findings that become Service Requests.

## Subtasks
- [[ST-11.1-Orba-Backend-Proxy-And-Send-Button]] — backend proxy module, route, config, frontend send button (done).
- [[ST-11.2-Orba-Live-Runtime-Values]] — wire the live BASE_URL / ASSETNUM / INGEST_SECRET (blocked on Orba dev).

## Context
- [[DR-020-Orba-CMMS-Integration-Server-Side-Proxy]] — the architectural decision (server-side proxy + frozen mappings).
- [[ST-05.4-Asset-Behaviours-And-Playback-Work-Orders]] — the `asset` site-lens, distinct from Orba's `assetnum`.
