# Task Index

The work tracker for rovision: goals (here) → bodies of work (`bodies/`) → subtasks (`subtasks/`). Status lives as a `Status:` field on each BOW/ST note; this index groups BOWs under goals and recomputes each goal's status from them.

Convention: [[DR-012-Task-Tracking-In-Vault]]

## Active

_(none)_

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
