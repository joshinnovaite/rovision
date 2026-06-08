# AmplifiedDataset

The propagated, pseudo-labelled training set (`rovision/dataset/`, with the durable copy on Google Drive) — the detector's actual training data. It pairs extracted frame images with boxes+class derived from SAM 2-propagated masks. Produced by [[label-amplification]] from the [[GoldenSet]].

What a future maintainer needs to know that the files don't say:

- **It is pseudo-labelled, not ground truth.** Boxes come from propagated [[masklet|masklets]], so quality varies by class: crisp objects (pipework, fish, valve/mixer) stay tight, while diffuse classes like [[surface deposit]] drift and bloat over the propagation window.
- **It accumulates per video.** Re-running a video replaces that video's records; this is what makes the batch resumable (see [[DR-006-Drive-Persistence-And-Resumable-Batch]]).
- **It is not a generalising dataset.** Near-duplicate frames and single-environment footage mean it exists to overfit, by design (see [[DR-005-Overfit-By-Design-PoC-Scope]]).

It is converted to YOLO format for training; see [[DR-004-YOLO11n-Detector-Choice]].
