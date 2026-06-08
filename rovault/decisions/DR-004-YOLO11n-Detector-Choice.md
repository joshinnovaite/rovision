# DR-004: YOLO11n Detector Choice

## Context
The [[DR-001-Detect-Then-Segment-Architecture|detector path]] needs a concrete model. The dataset is small, single-environment, and the demo overfits by design; speed was the stated priority.

## Decision
Ultralytics YOLO11n (the nano variant).

## Rationale
YOLO is real-time, has a ~5-line training API, ingests the box data natively, starts from COCO-pretrained weights, and exports easily — the low-friction tooling matters more than marginal accuracy here. Nano specifically has ample capacity to memorise a single-environment set and trains fastest, aiding iteration. Heavier options were rejected: RT-DETR (more data-hungry, slower), Faster R-CNN / Detectron2 (slow, heavy setup), plain DETR (data-hungry, slow to train).

## Consequences
End-to-end throughput stays bounded by SAM 2, not the detector, so "fast detector" buys a real-time *detector* but not a real-time full pipeline. Rare classes detect worst given the imbalance from [[DR-003-Defect-Taxonomy-Consolidation]]. Bumping to YOLO11s is a one-line change if recall is poor.

## Related
- [[DR-001-Detect-Then-Segment-Architecture]]
- [[DR-005-Overfit-By-Design-PoC-Scope]]
- [[detect-then-segment]]
