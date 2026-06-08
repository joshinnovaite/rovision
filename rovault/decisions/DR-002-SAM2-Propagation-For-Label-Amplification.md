# DR-002: SAM 2 Propagation for Label Amplification

## Context
The chosen [[DR-001-Detect-Then-Segment-Architecture|detector path]] needs training volume, but only a few hundred hand-drawn seed boxes exist in the [[GoldenSet]]. Hand-labelling thousands of frames is infeasible.

## Decision
Use SAM 2 video propagation to amplify each seed box into many per-frame labels, producing the [[AmplifiedDataset]].

## Rationale
SAM 2 turns one verified prompt into a tracked [[masklet]], from which a box can be read on every frame — cheap, and it reuses the verification already done on the seeds. Propagation is windowed to bound drift and compute.

Alternatives rejected: training on the raw handful of frames (too little signal); and — notably — **splicing golden frames into each target video as references** so SAM 2 would "recognise" defects. This fails because SAM 2's memory is *instance-appearance matching plus temporal continuity*, not category or few-shot transfer; that capability belongs to a different model class (in-context segmentation), not SAM 2.

## Consequences
Training labels are pseudo-labels, looser for diffuse classes like [[surface deposit]]. Amplified frames within a window are near-duplicates, which inflates validation metrics (see [[DR-005-Overfit-By-Design-PoC-Scope]]). Label *diversity* remains bounded by how varied the source footage is, not by the count.

## Related
- [[label-amplification]]
- [[AmplifiedDataset]]
- [[DR-001-Detect-Then-Segment-Architecture]]
