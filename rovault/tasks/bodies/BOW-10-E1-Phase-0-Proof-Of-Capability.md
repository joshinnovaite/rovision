# BOW-10: E1 Phase 0 — Proof of Capability (Reuse Pipeline)

Goal: [[taskindex#E1 race-footage CV (augment boat-net)]]
Status: in-progress
Progress: **Phase 0 functionally delivered; one pipeline-hygiene follow-up stays open.** 5 Como clips
cleaned + labelled (31 QC'd records) → propagated → E1 YOLO11n trained (autocast-guarded) → 5 §17 bundles
exported and ingested (`domain=e1`, 53 tracks); E1 appears in the app toggle. Scene state shipped: §18b
calibration ([[DR-017-Segment-Then-Measure-Scene-Attributes]]) + a per-clip meta.json scene badge
([[DR-019-Scene-Attribute-Aggregate-Badge-Surface]]). **Still open:** [[ST-10.11-Fold-Scene-Into-Notebook-Pipeline]]
— fold the calibrated thresholds into §18 and auto-emit the scene block from §17 (the 5 current bundles
were patched locally). BOW stays **in-progress** for that one item.

## Description
Phase 0 of the E1 domain ([[DR-018-E1-Phase-0-Phase-1-Split]]): **prove we can (a) detect race objects**
(`spray_plume` / `turn_buoy` / `race_boat`) **and (b) read scene state** (sky/water) by reusing the
existing label → propagate → train → demo pipeline ([[pipeline-overview]]) in as close to current form as
possible, under deadline. E1 rides **inventory mode** verbatim
([[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]], mirroring [[BOW-09-Insulators-Domain-Pipeline]]); scene
state rides a **gated §18 notebook bolt-on** ([[DR-017-Segment-Then-Measure-Scene-Attributes]]), not a
domain mode. No standalone app surface and no `boat-net` coupling in this phase — both are Phase 1, and the
phase seam is cheap (trained detector + amplified data carry forward).

## Dependencies
- **E1 broadcast footage** (external) — short single-pan clips into `test_footage_e1/`. **Current blocker**
  for the final three subtasks.
- [[BOW-07-Multi-Domain-App-Architecture]] — the registry, ingest `domain` field, inventory-mode app reused.
- [[BOW-09-Insulators-Domain-Pipeline]] — the inventory-domain precedent; labeller `--domain`, domain-aware
  notebook plumbing, §17 export all carry forward unchanged.
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the §16 autocast guard E1 training needs.

## Subtasks
- [[ST-10.1-E1-Domain-Registration]] — `e1` block in `domains.json` (DONE).
- [[ST-10.2-Notebook-S12-CLASS_LIST-Registry-Fix]] — §12 reads registry, not hardcoded subsea (DONE).
- [[ST-10.3-DR015-Autocast-Guard-Verified-S16]] — confirm the §16 training autocast guard (DONE).
- [[ST-10.4-Segment-Then-Measure-S18-Scaffold]] — §18 sky/water scene-state bolt-on (DONE).
- [[ST-10.5-E1-Footage-Capture]] — 5 Como clips cleaned + staged + labelled (DONE).
- [[ST-10.6-E1-Hero-Clip-S17-Demo-Branch]] — §17 `e1` branch; 5 `domain=e1` bundles exported (DONE).
- [[ST-10.7-E1-Label-Propagate-Train]] — label → propagate → train the E1 YOLO11n on Colab GPU (DONE).
- [[ST-10.8-Ingest-All-5-E1-Bundles]] — ingest all 5 bundles; E1 in the app toggle, 53 tracks (DONE).
- [[ST-10.9-S18b-Calibration-Sweep]] — §18b sweep + threshold calibration; water shipped binary, chop deferred (DONE).
- [[ST-10.10-Sky-Water-Aggregate-Scene-Badge]] — meta.json scene block + backend read + SceneBadge (DONE).
- [[ST-10.11-Fold-Scene-Into-Notebook-Pipeline]] — auto-emit scene into §17 meta.json so future clips self-populate (**OPEN / not-started**).

## Context
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — E1 = inventory mode, scene-mode deferred.
- [[DR-017-Segment-Then-Measure-Scene-Attributes]] — the §18 scene-state technique + §18b calibration.
- [[DR-019-Scene-Attribute-Aggregate-Badge-Surface]] — surfacing scene state as a per-clip meta.json badge.
- [[DR-018-E1-Phase-0-Phase-1-Split]] — the governing roadmap; this BOW is Phase 0.
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — the registry/mode framework reused.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — E1 gets its own overfit detector.
- [[subsea_defect_demo.ipynb]] — §12 fix, §16 guard, §17 branch, §18 bolt-on all live here.
- [[label_defects.py]] — the labeller (`--domain e1` appends to `labels_e1.json`).
