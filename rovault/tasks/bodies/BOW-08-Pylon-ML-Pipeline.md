# BOW-08: Pylon ML Pipeline

Goal: [[taskindex#Second domain — pylon insulators (multi-domain demo)]]
Status: abandoned
Progress: ABANDONED / superseded by [[BOW-09-Insulators-Domain-Pipeline]]. Taken all the way through
labelling + amplification + multiple training runs; the detector **never learned** (mAP pinned at 0,
`cls_loss` high, zero confident detections), even after collapsing the taxonomy 5→4→prominent-tower-only.
The data pipeline was sound — amplified boxes were tight/stable and `train_batch` labels were correct.
The `pylon` registry block + local files (`test_footage_pylon`, `labels_pylon.json`) have been removed.
Status stays **abandoned** (not being revived now); see the CORRECTION below for why the *reason* changed.

> **CORRECTION — root cause retracted; domain is revisitable.** This BOW originally concluded the
> aerial-pylon domain was **footage-unviable** (objects too small/thin/distant and deeply nested). **That
> was wrong as a root cause.** The mAP-0 collapse on these pylon runs is now known to have been caused by a
> **leaked global bf16 autocast** (from SAM 2 setup) corrupting YOLO's EMA validation weights —
> see [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the *same* environment bug that sank
> the insulator runs, **not** demonstrated object-unviability. Object scale/shape was at most a **secondary**
> concern, never the proven cause. The "footage-unviable" conclusion is therefore **retracted / uncertain**,
> and the aerial-pylon domain is **revisitable** now that the autocast bug is fixed — analogous to how
> `conductor` became revisitable. Status remains **abandoned** (correctness fix to the reason, not a revival).

## Why abandoned
Taken end-to-end (footage → taxonomy → golden set → SAM 2 amplification → multiple YOLO11n runs); the
detector trained to mAP 0 on every recipe, so the domain was set aside in favour of close-up insulator
footage ([[BOW-09-Insulators-Domain-Pipeline]]). The multi-domain framework itself
([[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]) held up perfectly — removing this domain was a
registry edit + file removal, zero architecture change. **On the cause of the collapse, see the CORRECTION
above:** [[DR-014-Domain-Viability-Gated-By-Object-Scale]] is the **wrong hypothesis** we recorded at the
time (object scale/shape), and [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] is the **true
cause** (the leaked autocast corrupting YOLO's EMA) that supersedes it.

## Description
Stand up the **pylon detection pipeline** to fill the `pylon` block of the registry and produce a
trained detector + an inference bundle the multi-domain app ([[BOW-07-Multi-Domain-App-Architecture]])
can ingest. Pylon is an **inventory** domain (components, not defects — see
[[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]), so the golden-set → amplify → detect→segment
pipeline ([[pipeline-overview]]) is reused with a pylon-specific class list and its own overfit model
([[DR-005-Overfit-By-Design-PoC-Scope]] — domains never share a detector).

## Dependencies
- **Pylon footage** (external) — the whole BOW is gated on footage being added to the repo.
- [[BOW-07-Multi-Domain-App-Architecture]] — provides the registry, ingest `domain` field, and inventory-mode app.
- [[BOW-01-Notebook-Export-Extension]] — the §17 bundle export contract this extends with `"domain":"pylon"`.

## Subtasks
- [[ST-08.1-Pylon-Footage-And-Class-Proposal]] — add footage; extract-only review frames → lock the `pylon` class list into the registry.
- [[ST-08.2-Labeller-Domain-Flag-And-Pylon-Golden-Set]] — labeller `--domain` flag + separate `labels_pylon.json`.
- [[ST-08.3-Pylon-Amplify-And-Train]] — Colab amplify + train a separate YOLO11n on pylon data.
- [[ST-08.4-Pylon-Bundle-Export]] — §17 bundle export with `"domain":"pylon"` + seed.

## Context
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — pylon = inventory mode; registry `pylon` block is the target.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — pylon gets its own overfit model on its own footage.
- [[DR-002-SAM2-Propagation-For-Label-Amplification]] — the amplification step reused for pylon seeds.
- [[label_defects.py]] — the labeller gaining a `--domain` flag.
- [[subsea_defect_demo.ipynb]] — the notebook gaining domain-aware class/bundle handling.
