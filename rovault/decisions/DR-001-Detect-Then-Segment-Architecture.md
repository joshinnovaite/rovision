# DR-001: Detect-Then-Segment Architecture

## Context
The project needs classified defect detection from video, but [[sam2-as-engine|SAM 2 is class-agnostic]] and cannot find objects on its own. Two architectures were candidates: (A) segment-everything with SAM 2's automatic mask generator, then classify each mask; (B) detect boxes+class first, then use SAM 2 to refine each to a mask.

## Decision
Architecture B — a trained detector proposes boxes and classes, SAM 2 refines them into precise masks.

## Rationale
The [[GoldenSet]] is already boxes+classes, i.e. detector training data; path A would instead need mask-crop labels. A detector is real-time, whereas the automatic mask generator fires a dense grid of points per frame and is slow. AMG also over-segments background and is poor at diffuse defects, while a detector fires only on the classes of interest. Finally, the [[label-amplification]] pipeline produces exactly the data path B needs.

## Consequences
A detector must be trained, which depends on amplified data (see [[DR-002-SAM2-Propagation-For-Label-Amplification]]). SAM 2's role narrows to mask refinement/quantification. The runtime becomes [[detect-then-segment]]: detector every frame, SAM 2 selectively. End-to-end throughput is therefore bounded by SAM 2, not the detector.

## Related
- [[pipeline-overview]]
- [[sam2-as-engine]]
- [[DR-004-YOLO11n-Detector-Choice]]
