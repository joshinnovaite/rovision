# rovision – Knowledge Vault

This vault captures the **why** behind rovision. For technical reference, see the codebase.

## Architecture
- [[pipeline-overview]] — the golden-set → amplify → detect → segment pipeline and why it is layered
- [[sam2-as-engine]] — what SAM 2 fundamentally can and cannot do, and why everything wraps it
- [[repository-topology]] — the standalone project vendoring SAM 2 and the work-account collaborator arrangement

## Workflows
- [[golden-set-labelling]] — the multi-pass, human-in-the-loop labelling sweep
- [[label-amplification]] — propagating seed boxes through clips to manufacture training data

## Decision Records
### Pipeline Architecture
- [[DR-001-Detect-Then-Segment-Architecture]]
### Labelling & Data
- [[DR-002-SAM2-Propagation-For-Label-Amplification]]
- [[DR-003-Defect-Taxonomy-Consolidation]]
### Detector
- [[DR-004-YOLO11n-Detector-Choice]]
### Scope & Infrastructure
- [[DR-005-Overfit-By-Design-PoC-Scope]]
- [[DR-006-Drive-Persistence-And-Resumable-Batch]]
- [[DR-010-Standalone-Repository-Restructure]]
### Detect→Segment Inference
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]]
- [[DR-008-Selective-SAM2-Refinement-Cadence]]
- [[DR-009-Mask-Hold-Rendering]]
### Playback UI
- [[DR-011-LOD-Density-Cluster-Timeline]] — horizontal LOD playback bar replacing the vertical timeline

## Data Models
- [[GoldenSet]] — the hand-labelled seed prompts (labels.json)
- [[AmplifiedDataset]] — the propagated pseudo-labelled training set
- [[InferenceOutputs]] — the demo's per-frame and per-instance detection cards

## Modules
- [[label_defects.py]] — the local labelling GUI
- [[subsea_defect_demo.ipynb]] — the Colab pipeline notebook

## Work Tracking
Durable, session-resumable task tracker for the demo-application build (`rovault/todo/`). Each BOW
links its subtasks; each subtask is pick-up-able cold.
- [[BOW-01-Notebook-Export-Extension]] — §17 emits the per-video bundle (polygons, faststart raw.mp4, meta).
- [[BOW-02-Backend]] — FastAPI + SQLite ingest/serve (range-seekable clip, hash dedup).
- [[BOW-03-Frontend-Foundation]] — Vite/React/TS scaffold, types/client/fixture, stores + derived structures.
- [[BOW-04-Shell-And-Pre-Playback-Screens]] — sidebar, library, upload modal, dashboard, work orders.
- [[BOW-05-Playback]] — video stage + SVG overlay, frame-sync/mask-hold, timeline, asset behaviours.
- [[BOW-06-Horizontal-LOD-Playback-Bar]] — horizontal zoomable LOD bar (density clustering) replacing the vertical timeline.

## Glossary
- [[golden set]] — the seed labels
- [[label amplification]] — multiplying labels via propagation
- [[surface deposit]] — the merged material-defect class
- [[artefact]] — a non-defect class in the taxonomy
- [[masklet]] — a tracked mask through a video
- [[detect-then-segment]] — the runtime architecture
