# BOW-09: Insulators Domain Pipeline

Goal: [[taskindex#Second domain — pylon insulators (multi-domain demo)]]
Status: done
Progress: **DONE — the insulators demo ships.** The real blocker was never object shape: the repeated
zero-mAP collapse was a **leaked global bf16 autocast** corrupting YOLO's EMA validation weights
([[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]]). Fix = wrap §16 training in
`with torch.autocast('cuda', enabled=False):` → `cls_loss` ~0.5, **mAP50 0.994**. Final taxonomy:
`insulator_string` + `worker` (2 classes, inventory mode); footage = 9 short single-pan clips
(maw_1–maw_9). Two seeded bundles (`maw_3`, `maw_5`) under `domain=insulators` show in the app under the
"Pylon Insulators" toggle. `conductor` was dropped partly on the now-corrected box-hostile reasoning, so it
is **revisitable**. (Historical: v1 with the close-up disc-chain footage + `insulator_string`+`conductor`
hit the same collapse — at the time mis-attributed to SAM 2 disc-chain fragmentation; that instability is
real but secondary, not the cause.)

## Description
Stand up the **insulators detection pipeline** to fill the `insulators` block of the registry
([[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]) and produce a trained detector + an inference bundle
the multi-domain app ([[BOW-07-Multi-Domain-App-Architecture]]) can ingest. This replaced the abandoned
aerial-pylon domain, then itself iterated twice under the viability gate of
[[DR-014-Domain-Viability-Gated-By-Object-Scale]] — see [[domain-viability-and-detector-diagnostics]] for
the reusable lessons.

Insulators is an **inventory** domain (components, no defects — the footage shows healthy insulators), so
the golden-set → amplify → detect→segment pipeline ([[pipeline-overview]]) is reused with an insulators
class list and its own overfit model ([[DR-005-Overfit-By-Design-PoC-Scope]] — domains never share a
detector).

**Taxonomy history:**
- v0 (from ST-09.1, never trained): 4 classes — `insulator_string`, `cross_arm`, `conductor`, `pylon_body`.
- v1 (trained, FAILED): collapsed to `insulator_string` + `conductor`.
- **v2 (current, in `rovision/domains.json`): `insulator_string` + `worker`.** `worker` = the hi-vis
  linemen (compact, solid, COCO `person` — the most box-friendly reliable class). `conductor` dropped as
  intrinsically thin/elongated (box-hostile + SAM 2-fragmentation-prone); preserved in a backup, re-addable.
  `insulator_disc` (swarm) and `foundation` (sparse) remain excluded.

## Dependencies
- **Insulator footage** (external) — 3 clips already in `test_footage_insulators/`.
- [[BOW-07-Multi-Domain-App-Architecture]] — provides the registry, ingest `domain` field, inventory-mode app.
- [[BOW-08-Pylon-ML-Pipeline]] — the abandoned predecessor; its labeller `--domain` flag and domain-aware
  notebook plumbing carry forward unchanged.
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] — the viability gate that motivated this domain.

## Subtasks
- [[ST-09.1-Insulator-Footage-Scan-And-Taxonomy]] — footage scan + taxonomy proposal (DONE).
- [[ST-09.2-Insulator-Golden-Set]] — label golden set (DONE — redone for v2: 9 maw clips, `insulator_string`+`worker`).
- [[ST-09.3-Insulator-Amplify-And-Train]] — Colab amplify + train a separate YOLO11n (DONE — mAP50 0.994 after the autocast fix).
- [[ST-09.4-Insulator-Bundle-Export]] — §17 bundle export with `domain=insulators` + seed (DONE — `maw_3`, `maw_5` seeded).

## Context
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — insulators = inventory mode; reinforced through every pivot.
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the TRUE root cause of the zero-mAP collapse; the fix that let this ship.
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] — the superseded object-shape hypothesis (cautionary record).
- [[domain-viability-and-detector-diagnostics]] — the reusable checklist + diagnostic playbook from this BOW's churn.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — insulators gets its own overfit model.
- [[DR-002-SAM2-Propagation-For-Label-Amplification]] — the amplification step reused (and the source of v1's corruption).
- [[label_defects.py]] — the labeller (already has `--domain`; appends to `labels_<domain>.json`, so curate between footage swaps).
- [[subsea_defect_demo.ipynb]] — the already-domain-aware notebook.
