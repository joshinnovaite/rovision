# DR-020: File Findings into Orba (CMMS) via a Server-Side Proxy, Not the Browser

## Context
The Subsea demo derives "suggested work orders" from flagged tracks (see [[ST-04.4-Work-Order-List]],
[[ST-05.4-Asset-Behaviours-And-Playback-Work-Orders]]) but until now they lived only in the UI. The new
requirement: push them into **Orba**, an external CMMS, as **Service Requests (SRs)**. This is the app's
**first outbound-internet integration** — every prior call stayed inside the single-origin `/api` proxy
([[BOW-02-Backend]]). The Orba developer supplied a browser-direct drop-in adapter (`orba/orbaAdapter.ts`)
as the contract reference. The decision: where does the POST to Orba originate — the browser, or our backend?

## Decision
The POST originates from **our FastAPI backend, not the browser.** The frontend calls our own same-origin
`POST /api/orba/service-requests`; the backend (`app/backend/orba.py`) forwards each SR to the live Orba URL
via `httpx`. The supplied `orbaAdapter.ts` is **kept as the frozen contract reference, not imported.** Frozen
companion decisions:
- **Severity → Orba priority (1–9):** high→2, medium→4, low→6, none→**skip** (no SR filed). Agreed with the
  Orba developer.
- **One SR per finding** (per defect class), sent **sequentially** to keep Orba's `SR-####` autokey clean.
- **Single hardcoded `assetnum`** (env var `ORBA_ASSETNUM`, site BEDFORD) for every video — Subsea work orders
  are deliberately **asset-agnostic** (see below). Production would capture `assetnum` per dive.
- **Explicit "Send to Orba" button** on the Dashboard (not auto-send), with a **per-video duplicate guard**
  (disabled after a successful send for that video's hash).

## Rationale
- **Secret stays server-side.** A Vite-injected secret is inlined as plaintext into the JS bundle; the shared
  secret guarding Orba's public write routes would be readable in devtools. The backend holds it in a server
  env var (`ORBA_INGEST_SECRET`).
- **No browser CORS/preflight coupling.** An `Authorization` header makes the call a non-simple cross-origin
  request, requiring an OPTIONS preflight and `Access-Control-*` headers from Orba — a dependency on Orba's
  CORS config we avoid by going server-to-server.
- **Preserves the single-origin invariant.** [[BOW-02-Backend]] established one `/api` origin; browser-direct
  would be the first call to break it. The proxy keeps that design intact.
- **Explicit button + dedup guard, not auto-send,** because findings **recompute live on every replay** and
  Orba has **no SR dedup** — auto-send would flood Orba with duplicate SRs on each scrub.

## Consequences
- A new backend seam exists: `POST /api/orba/service-requests` (Pydantic `OrbaSendRequest`/`OrbaFinding`),
  `app/backend/orba.py` (pure severity→priority map + sequential `httpx` POST), and three env vars loaded by
  `config.py` from a gitignored `app/backend/.env` (`.env.example` committed). The route returns **503** if
  `ORBA_BASE_URL`/`ORBA_ASSETNUM` are unset.
- **`assetnum` ≠ the Subsea `asset` field.** The existing `asset` is a site-**lens** (wivenhoe/hinze/…, see
  [[ST-05.4-Asset-Behaviours-And-Playback-Work-Orders]]); Orba's `assetnum` is a real CMMS asset identity at
  BEDFORD. **Different namespaces — must not be conflated.** The demo sidesteps the gap with one hardcoded
  `assetnum`; per-dive asset capture is deferred to production.
- Build is **complete and verified against a local stub.** The **live demo is gated** on three values still
  owed by the Orba developer: a live `ORBA_BASE_URL`, a valid BEDFORD `ORBA_ASSETNUM`, and the shared
  `ORBA_INGEST_SECRET`.

## Related
- [[BOW-02-Backend]] — the single-origin `/api` proxy this integration extends server-side.
- [[BOW-11-Orba-CMMS-Service-Request-Integration]] — the body of work delivering this.
- [[ST-04.4-Work-Order-List]] — the work-order findings that become SRs.
- [[ST-05.4-Asset-Behaviours-And-Playback-Work-Orders]] — the `asset` site-lens distinct from Orba `assetnum`.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — findings derive from tracked instances.
