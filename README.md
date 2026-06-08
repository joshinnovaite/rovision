# Rovision

**Defect detection for subsea / underwater infrastructure inspection footage** — water tanks,
dams, tunnels, trash racks, biofouling, and similar assets. Rovision is a proof-of-concept
pipeline that turns raw ROV inspection video into per-instance defect detections (class + box +
mask + pixel area), built on top of Meta's [SAM 2](https://github.com/facebookresearch/sam2).

> **Status:** research PoC on a single environment's footage, not a production model. See the
> design notes in [`rovault/`](rovault/) for the *why* behind every decision.

## Architecture: detect → segment

Rovision is deliberately **detect-then-segment**, not segment-then-classify:

1. A fast **YOLO11n** detector proposes a class + bounding box on every frame (real-time).
2. **SAM 2** refines selected detections into pixel-accurate masks for defect quantification
   (area / coverage), on a cadence rather than every frame.

SAM 2 is a *promptable, class-agnostic* segmenter/tracker — it has **no notion of class** and
never decides "this is corrosion." All classification comes from the human (labelling) or the
trained detector. Rovision is the layer that wraps SAM 2 with the "what" and "where" it lacks.

## The pipeline (end-to-end)

| Stage | Where | Output |
|-------|-------|--------|
| **1. Label** | [`rovision/labelling/label_defects.py`](rovision/labelling/label_defects.py) (local GUI) | `labels.json` — the hand-drawn golden set |
| **2. Verify** | notebook §12 | golden-set boxes → SAM 2 masks, sanity overlay |
| **3. Amplify** | notebook §13–14 | SAM 2 propagates each seed box across a frame window → amplified training set |
| **4. Train** | notebook §15–16 | amplified set → YOLO format → overfit **YOLO11n** detector |
| **5. Detect→Segment demo** | notebook §17 | YOLO (ByteTrack) + selective SAM 2 refinement → per-instance detection cards + overlay video |

The pipeline notebook is [`rovision/notebooks/subsea_defect_demo.ipynb`](rovision/notebooks/subsea_defect_demo.ipynb),
organised into numbered sections. **It runs on a Colab GPU runtime** — the heavy stack
(`torch`, the `sam2` package) is installed in Colab by the notebook's first cell.

## Repository layout

```
sam2/                         vendored SAM 2 library (the segmentation/tracking engine)
checkpoints/download_ckpts.sh SAM 2 checkpoint download
rovision/
  labelling/                  local labelling tool, requirements, and the golden set
  notebooks/                  the Colab pipeline notebook
  dataset/                    amplified dataset (gitignored; durable copy lives on Google Drive)
rovault/                      Obsidian-style knowledge vault — the "why" layer
```

## Local labelling

The labelling tool is the only part run locally (the dev machine is a Mac with no NVIDIA GPU):

```bash
conda create -n rovision python=3.10 && conda activate rovision
python -m pip install -r rovision/labelling/requirements.txt   # opencv-python + matplotlib
python rovision/labelling/label_defects.py --offset 0.0        # interactive GUI labelling
```

Multi-pass labelling: bump `--offset` each pass to sweep new frames; output accumulates in
`rovision/labelling/labels.json`.

## Built on SAM 2

Rovision vendors and depends on Meta's **SAM 2** (Segment Anything in Images and Videos), used
under the **Apache 2.0** licence. The `sam2/` directory is the upstream library, kept pristine;
see [`LICENSE`](LICENSE) and the per-file copyright headers within `sam2/`. The original project:
<https://github.com/facebookresearch/sam2>.
