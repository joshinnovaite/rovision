# DR-005: Overfit-By-Design PoC Scope

## Context
The dataset is a small set of seed labels amplified across one operator's footage. The goal is to demonstrate that the [[pipeline-overview|pipeline]] works, not to ship a deployable model.

## Decision
Deliberately overfit the detector: no early stopping, and validation metrics are treated as non-meaningful.

## Rationale
A few hundred seeds across a single visual environment cannot yield a generalising detector, so chasing generalisation would be wasted effort. The PoC's job is to prove the [[detect-then-segment]] plumbing on similar footage end-to-end. Overfitting is the fastest route to a convincing demo on that footage.

## Consequences
Validation mAP is inflated because [[label-amplification]] produces near-duplicate frames that land on both sides of the train/val split — the numbers are not a real signal. Honest evaluation is qualitative: run the model on footage and look. Productionising would require far more diverse labelled data and a real held-out evaluation.

Because the model is overfit, it must be **judged on in-distribution footage**: the §17 demo (see [[subsea_defect_demo.ipynb]]) runs on a seed-region window near the labelled frames, not on arbitrary new video. Off-distribution behaviour is expected to fail in instructive ways — e.g. a corroded ladder is read as `corrosion` rather than `ladder`, because the only ladder training examples were a clean yellow ladder, so the model recognises the dominant surface texture it was actually shown rather than the object. This is the overfit boundary doing exactly what this decision predicts, not a separate problem — it is recorded here rather than as a new DR.

## Related
- [[DR-002-SAM2-Propagation-For-Label-Amplification]]
- [[DR-004-YOLO11n-Detector-Choice]]
- [[pipeline-overview]]
- [[subsea_defect_demo.ipynb]]
- [[InferenceOutputs]]
