# DR-009: Mask-Hold Rendering

## Context
Because SAM 2 refines only every `REFINE_EVERY`th frame ([[DR-008-Selective-SAM2-Refinement-Cadence]]), fresh [[masklet|masks]] exist on roughly 1-in-10 frames. The naive renderer drew masks only on those frames, so the shaded overlay blinked ~5 times a second — visually distracting and reading as instability rather than a property of the cadence.

## Decision
Cache the last mask per `track_id` and re-paint that held mask on every frame between refinements ("a stable mask that occasionally re-tightens").

## Rationale
The blink is a rendering artefact, not a compute limit, so it should be fixed in rendering, not by running SAM 2 more often. Re-painting a cached mask costs nothing extra in SAM 2 compute yet yields a stable, continuous overlay. The accepted trade-off: a held mask lags a moving object slightly, then snaps and re-tightens at the next true SAM 2 frame. A "box-follow" variant — affine-warping the held mask onto the detector's new box each frame to track motion between refinements — was considered and rejected for now as unnecessary polish for a demo.

## Consequences
The overlay is stable but momentarily stale between refinements; the visible snap at each refinement frame is expected behaviour, not a bug. The renderer must carry per-`track_id` mask state, coupling it to the [[DR-007-Tracked-Instances-Over-Per-Frame-Detection|track identities]]. The box-follow option remains on the table if smoother motion is later wanted.

## Related
- [[DR-008-Selective-SAM2-Refinement-Cadence]]
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]]
- [[masklet]]
- [[subsea_defect_demo.ipynb]]
