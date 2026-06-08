# Pipeline Overview

rovision detects and classifies defects in subsea inspection footage. It is layered because [[sam2-as-engine|SAM 2]] supplies precise segmentation but no notion of class or autonomous detection, so the surrounding stages supply the "what" and "where" it lacks.

The stages:
1. **Label** — a human draws a small [[golden set]] of boxes+classes on sampled frames (see [[golden-set-labelling]]).
2. **Amplify** — SAM 2 propagates each seed box through its clip, multiplying a few hundred seeds into thousands of pseudo-labels (see [[label-amplification]], [[AmplifiedDataset]]).
3. **Detect** — a fast detector trains on the amplified set to propose boxes+class per frame (see [[DR-004-YOLO11n-Detector-Choice]]).
4. **Segment** — SAM 2 refines detector boxes into precise masks for quantification (area, coverage).

The runtime composite is [[detect-then-segment]]: the detector runs fast on every frame; SAM 2 is invoked selectively where defect extent must be measured. The amplification stage exists only because a detector needs training volume that hand-labelling cannot cheaply provide. See [[DR-001-Detect-Then-Segment-Architecture]] for why this ordering beat segment-then-classify, and [[DR-005-Overfit-By-Design-PoC-Scope]] for why the whole thing is a proof-of-concept.
