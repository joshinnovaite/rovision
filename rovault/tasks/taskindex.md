# Task Index

The work tracker for rovision: goals (here) → bodies of work (`bodies/`) → subtasks (`subtasks/`). Status lives as a `Status:` field on each BOW/ST note; this index groups BOWs under goals and recomputes each goal's status from them.

Convention: [[DR-012-Task-Tracking-In-Vault]]

## Active

### E1 race-footage CV (augment boat-net) (in-progress)
A third domain: computer vision on E1 powerboat race **broadcast footage**, in proof-of-capability mode. Its ultimate purpose is to augment the separate `boat-net` telemetry project — supplying the exogenous layer telemetry is blind to (weather, water state, start line, course orientation) plus causal context for telemetry-flagged events. The `boat-net` connection is staged for later; build the CV pipeline standalone first ([[DR-018-E1-Phase-0-Phase-1-Split]]).
- [[BOW-10-E1-Phase-0-Proof-Of-Capability]] — in-progress (Phase 0 functionally delivered: 5 Como clips labelled → trained → 5 `domain=e1` bundles ingested, E1 in the app toggle, 53 tracks; scene state shipped via §18b calibration + a per-clip meta.json scene badge. One pipeline-hygiene follow-up stays open — fold the calibrated scene block into the §17 export so future clips self-populate ([[ST-10.11-Fold-Scene-Into-Notebook-Pipeline]]) — so the BOW stays in-progress).

### External integrations — CMMS (Orba) (in-progress)
The Subsea app's first outbound-internet integration: file suggested work orders into Orba (external CMMS) as Service Requests, via a server-side proxy on our FastAPI backend (not the browser). Build is done and stub-verified; the live demo is blocked on runtime values still owed by the Orba developer.
- [[BOW-11-Orba-CMMS-Service-Request-Integration]] — in-progress (implementation done — [[ST-11.1-Orba-Backend-Proxy-And-Send-Button]]; live wiring blocked on three values from the Orba dev — [[ST-11.2-Orba-Live-Runtime-Values]]).

## Completed

### Second domain — pylon insulators (multi-domain demo) (complete)
Extend the single-domain (subsea-defect) demo to host a second domain in the same app behind a sidebar toggle. Track A (the multi-domain app architecture) shipped. Track B churned hard chasing a "loss falls but val mAP exactly 0" collapse — long mis-attributed to footage/object viability, but the true cause was a **leaked global bf16 autocast** corrupting YOLO's EMA validation weights ([[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]]). With that fixed, the **insulators** detector trains to **mAP50 0.994** and the demo ships (`insulator_string`+`worker`, inventory mode, bundles `maw_3`/`maw_5`). Reusable diagnostic lessons in [[domain-viability-and-detector-diagnostics]].
- [[BOW-07-Multi-Domain-App-Architecture]] — done (Track A: registry, backend plumbing, domain state + toggle, inventory-mode UI).
- [[BOW-08-Pylon-ML-Pipeline]] — abandoned/superseded (aerial pylons; preserved as a record). Note: also a victim of the autocast leak, not just object scale.
- [[BOW-09-Insulators-Domain-Pipeline]] — done (Track B: shipped after the autocast fix; `insulator_string`+`worker`, two seeded bundles under `domain=insulators`).

### Rovision Demo Development (complete)
Build the subsea-defect demo application end-to-end: extend the §17 notebook to export self-contained per-video inference bundles, a FastAPI backend that ingests and serves them, and a Vite/React SPA that replays detections — sidebar, upload, dashboard, work orders, and a zoomable level-of-detail playback bar.
- [[BOW-01-Notebook-Export-Extension]]
- [[BOW-02-Backend]]
- [[BOW-03-Frontend-Foundation]]
- [[BOW-04-Shell-And-Pre-Playback-Screens]]
- [[BOW-05-Playback]]
- [[BOW-06-Horizontal-LOD-Playback-Bar]]
