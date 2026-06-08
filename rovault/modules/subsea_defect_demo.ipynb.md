# subsea_defect_demo.ipynb

The single Colab notebook that carries the entire GPU-side pipeline. It is one notebook, organised into numbered sections, because keeping the GPU workflow in one place is simpler than scattering scripts; it runs on Colab because the dev machine has no NVIDIA GPU (see [[repository-topology]]).

Section intent (the "why," not a cell listing):
- **§1–11** — a standalone manual single-prompt demo of SAM 2 video tracking, kept for quick exploration.
- **§12 Verify** — checks the [[GoldenSet]] boxes produce sensible masks before they are trusted.
- **§13–14 Amplify** — the [[label-amplification]] step; §14 is the resumable Drive batch (see [[DR-006-Drive-Persistence-And-Resumable-Batch]]).
- **§15–16 Detect** — convert the [[AmplifiedDataset]] to YOLO format and train (see [[DR-004-YOLO11n-Detector-Choice]]).
- **§17 Detect→Segment demo** — the capstone inference stage that runs the full [[detect-then-segment]] runtime on footage: ByteTrack-tracked detection (see [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]]), selective SAM 2 refinement (see [[DR-008-Selective-SAM2-Refinement-Cadence]]), mask-hold rendering (see [[DR-009-Mask-Hold-Rendering]]), emitting the [[InferenceOutputs]] cards. It is run on in-distribution footage by design (see [[DR-005-Overfit-By-Design-PoC-Scope]]).

Two intents that bit during development and shaped the code: the install cell verifies `import sam2` for real rather than printing a fixed success message, and sections are written to be independently runnable given their inputs. See [[pipeline-overview]] for how the sections compose.
