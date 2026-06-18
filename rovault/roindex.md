# rovision – Knowledge Vault

This vault captures the **why** behind rovision. For technical reference, see the codebase.

## Architecture
- [[pipeline-overview]] — the golden-set → amplify → detect → segment pipeline and why it is layered
- [[sam2-as-engine]] — what SAM 2 fundamentally can and cannot do, and why everything wraps it
- [[repository-topology]] — the standalone project vendoring SAM 2 and the work-account collaborator arrangement

## Workflows
- [[golden-set-labelling]] — the multi-pass, human-in-the-loop labelling sweep
- [[label-amplification]] — propagating seed boxes through clips to manufacture training data
- [[domain-viability-and-detector-diagnostics]] — the "loss falls but val mAP is exactly 0" diagnostic playbook (lead: audit for leaked global state) + a secondary footage/object viability checklist

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
### Multi-Domain
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — second domain via a shared domain registry + inventory mode
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] — **root cause RETRACTED** (object-shape was a red herring); kept as a cautionary record, superseded by DR-015
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the TRUE cause of the "loss falls, val mAP exactly 0" collapse: a leaked global bf16 autocast (SAM 2 setup) corrupting YOLO's EMA validation weights (see [[domain-viability-and-detector-diagnostics]])
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — E1 (race broadcast footage) registered as a third domain reusing inventory mode (no new mode) for Phase 0
- [[DR-017-Segment-Then-Measure-Scene-Attributes]] — segment-then-measure: SAM 2 masks sky/water, a classical descriptor reads scene state; inverts detect→segment, produces a frame-level attribute
- [[DR-018-E1-Phase-0-Phase-1-Split]] — the E1 roadmap: Phase 0 reuse-the-pipeline proof, Phase 1 standalone surface + staged boat-net time-alignment
- [[DR-019-Scene-Attribute-Aggregate-Badge-Surface]] — scene state surfaced as a per-clip meta.json aggregate badge (SceneBadge), no new mode, no schema migration; the app-side companion to DR-017's calibration
### Vault Process
- [[DR-012-Task-Tracking-In-Vault]] — folding the task tracker into the vault (status-as-field, type-as-folder)

## Data Models
- [[GoldenSet]] — the hand-labelled seed prompts (labels.json)
- [[AmplifiedDataset]] — the propagated pseudo-labelled training set
- [[InferenceOutputs]] — the demo's per-frame and per-instance detection cards

## Modules
- [[label_defects.py]] — the local labelling GUI
- [[subsea_defect_demo.ipynb]] — the Colab pipeline notebook

## Tasks
- [[taskindex]] — the work tracker (goals → bodies of work → subtasks).

## Glossary
- [[golden set]] — the seed labels
- [[label amplification]] — multiplying labels via propagation
- [[surface deposit]] — the merged material-defect class
- [[artefact]] — a non-defect class in the taxonomy
- [[masklet]] — a tracked mask through a video
- [[detect-then-segment]] — the runtime architecture
