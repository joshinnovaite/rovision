# DR-008: Selective SAM 2 Refinement Cadence

## Context
In the §17 demo, the detector runs every frame (real-time), but [[sam2-as-engine|SAM 2]] is the throughput bottleneck of [[detect-then-segment]] (established in [[DR-001-Detect-Then-Segment-Architecture]]). Refining every detected box into a mask on every frame is infeasible at interactive speed.

## Decision
Run SAM 2 refinement only every `REFINE_EVERY`th frame (default 10), not on every frame. On refinement frames, SAM 2 turns the tracked boxes into masks and computes per-instance quantities (`area_px`, `coverage_frac`).

## Rationale
SAM 2 is what makes the masks pixel-accurate and the area/coverage numbers meaningful, but it is also what caps end-to-end speed. The detector and ByteTrack ([[DR-007-Tracked-Instances-Over-Per-Frame-Detection]]) already give continuous boxes and identity cheaply on every frame, so SAM 2 only needs to fire periodically to keep masks and measurements roughly current. A cadence knob lets the demo trade refresh rate against speed without touching the architecture.

## Consequences
Quantitative measurements (`area_px`, `coverage_frac`) exist ONLY on true SAM 2 frames; intermediate frames have boxes and class but no fresh measurement — see the optional fields in [[InferenceOutputs]]. This is also what forces the rendering question answered in [[DR-009-Mask-Hold-Rendering]]: masks are only freshly available 1-in-`REFINE_EVERY` frames.

## Related
- [[DR-001-Detect-Then-Segment-Architecture]]
- [[sam2-as-engine]]
- [[DR-009-Mask-Hold-Rendering]]
- [[InferenceOutputs]]
