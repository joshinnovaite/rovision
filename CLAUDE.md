# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is the **"rovision" project** — a proof-of-concept for detecting defects in subsea/underwater infrastructure inspection footage (water tanks, dams, tunnels, trash racks, biofouling, etc.). It began as a fork of Meta's SAM 2 but is now a **standalone project that vendors SAM 2 as a dependency** (Meta upstream is no longer tracked). Treat the repo as **two layers**:

1. **Vendored SAM 2** (`sam2/`) — the unmodified, promptable segmentation/tracking library. **Kept pristine** — treat it as a third-party dependency, not the work. (Its demo/training/eval scaffolding has been removed; only the importable `sam2/` package remains.)
2. **The rovision layer** — the actual project, living in `rovision/` (`labelling/`, `notebooks/`, `dataset/`). **This is where work happens.**

> **Critical mental model:** SAM 2 is a *promptable, class-agnostic* segmenter+tracker. It segments/tracks whatever it is prompted with (point/box/mask) and has **no notion of class** — it never decides "this is corrosion." All classification comes from the human (labelling) or the trained detector. The whole rovision pipeline exists to wrap SAM 2 with the "what" and "where" it lacks.

## Knowledge retrieval: the vault

The Obsidian-style knowledge vault at rovault is the canonical store for rovision's **"why" layer** — architectural rationale, design decisions (DRs), domain glossary, and workflow logic. Two subagents mediate access:
- **`vault-librarian`** — read-only. Consults the vault and returns cited summaries.
- **`vault-scribe`** — writes new notes / updates existing ones inside rovault only.

**Rely on these agents rather than loading vault content into main context yourself.** Vaults grow large; the librarian surfaces only what's relevant. For "what the code currently does" (routes, models, module maps), consult the code base. The vault covers "why"; the code covers "what."

## Per-task workflow
For any non-trivial task:
1. **Brief the librarian.** At task start, spawn `vault-librarian` with the user's stated goal to retrieve relevant architectural and decision context. Incorporate its summary into your planning.
2. **Plan, implement, verify.** Standard plan-mode → implement → test loop.
3. **Commission the scribe** *if* the task introduced a new subsystem, module, data model, workflow, or significant design decision. Pass the scribe a brief of what changed and why. Skip this step for pure bug fixes or cosmetic changes with no design implication.
4. **Conflict-check the new notes.** Spawn `vault-librarian` in Mode B with the list of files the scribe created or edited. If the verdict is `needs-revision` or `conflicts-found`, resolve before committing.
5. **Mark complete / commit** only after the above. Vault notes are committed alongside the code change.

## Guardrails
- **Never read rovault files directly** in the main session. Always go through `vault-librarian`. The vault is large; direct reads pollute main context with irrelevant material.
- **Never write to rovault directly** from the main session. Always go through `vault-scribe`. Direct writes bypass the update-vs-create rule and produce orphan notes.
- **Skip the scribe for trivial work.** Bug fixes, cosmetic CSS, dependency bumps, and similar changes do not warrant a vault entry. The vault captures *decisions*, not *activity*.
- **Always run the conflict check** when the scribe has written anything. Skipping it produces contradictions that compound over time.

## Git setup

- `origin` → `joshinnovaite/rovision`. There is **no `upstream` remote** — rovision is standalone and no longer tracks Meta's SAM 2.
- Work on feature branches; `main` tracks `origin/main`. Push only when asked.

## Commands

**Local labelling tool** (the only part run locally — the dev machine is a Mac with no NVIDIA GPU):
```bash
conda create -n rovision python=3.10 && conda activate rovision
python -m pip install -r rovision/labelling/requirements.txt              # opencv-python + matplotlib only
python rovision/labelling/label_defects.py --offset 0.0                   # interactive GUI labelling
python rovision/labelling/label_defects.py --extract-only --offset 0.0    # dump frames to label_review/ for review
python rovision/labelling/label_defects.py --video fire_tank --frames 250,800 # targeted frames for one video
python -m py_compile rovision/labelling/label_defects.py                  # syntax-check (no real test suite)
```
Multi-pass labelling: bump `--offset` each pass to sweep new frames; output accumulates in `rovision/labelling/labels.json`.

**SAM 2 itself runs on Colab GPU, not locally.** The heavy stack (`torch>=2.5.1`, the `sam2` package) is installed *in Colab* by the notebook. If you ever must install locally: `SAM2_BUILD_CUDA=0 pip install -e ".[notebooks]"` (the CUDA ext is optional post-processing). There is **no automated test suite**; the notebooks are the functional checks.

## The rovision pipeline (end-to-end)

All stages after labelling live in `rovision/notebooks/subsea_defect_demo.ipynb`, organised by numbered section. The architecture is deliberately **detect → segment** (a fast detector proposes boxes+class, SAM 2 refines to masks), *not* segment-then-classify.

1. **Label** (`rovision/labelling/label_defects.py`, local) → `rovision/labelling/labels.json`. Each record is one hand-drawn box: `{video, frame, defect, point, bbox}` (`bbox` is xyxy; `point` is the box centre, supplementary). 15-class taxonomy.
2. **Verify** (notebook §12) — feed golden-set **boxes** to `SAM2ImagePredictor` on the exact labelled frames; overlay masks to confirm prompts are sane.
3. **Amplify** (§13 single-video, §14 batch) — `SAM2VideoPredictor` propagates each golden-set box across a short forward window of frames, turning each seed box into ~25 labelled frames → `rovision/dataset/{amplified_labels.json, images/}`. This is the label-multiplier that makes the detector trainable from a small seed set.
4. **Convert + train** (§15, §16) — amplified dataset → YOLO format (`data.yaml` + normalized `cx cy w h`) → train **YOLO11n** (Ultralytics), overfit-by-design (`patience=0`), saved to Drive.

The runtime demo is the detect→segment composite: YOLO (real-time, every frame) → SAM 2 (selective mask refinement for defect quantification — area/coverage).

## Conventions and gotchas that will bite you

- **Frame indices in `labels.json` are *original* video frame numbers** (from `cv2` seeking during labelling). The notebook's `ffmpeg` frame extraction uses a stride and **renumbers** frames — the two do **not** align. Always read exact frames by original index via `cv2`; never assume `frames/NNNNN.jpg` matches a label's `frame`.
- **Use box prompts, not derived points** — `add_new_points_or_box(..., box=...)`. A box is a more robust prompt and avoids the "centre point lands off a non-convex object" problem.
- **The 15-class taxonomy is defined twice** — `DEFECTS`/`ARTEFACTS` in `rovision/labelling/label_defects.py` and `CLASSES` in notebook §15. Keep them in sync. (Consolidated set: empty classes dropped; `biofilm`+`calcareous_deposits`+`sediment_debris` merged into `surface_deposit` because they're visually inseparable in murky footage.)
- **Colab `/content` is ephemeral.** Amplification/training read and write to **Google Drive** (`MyDrive/rovision/`) for persistence; the §14 batch is resumable (`RESUME=True` skips videos already in the output JSON, saving after each video).
- **The Colab notebook is the product, run on a GPU runtime.** `files.upload()` does not work in the VS Code Colab extension; the web UI is the intended path. The install cell verifies `import sam2` for real (no silent "installed" message) and always runs `pip install` (never skipped behind a clone-exists guard).
- **Overfitting is intentional** — this is a pipeline PoC on a single environment's footage, not a generalising model. Val metrics are inflated by near-duplicate amplified frames across the split; the real test is running on footage and looking.

## SAM 2 layer reference (when you do need it)

- Entry points: `sam2/build_sam.py` (`build_sam2`, `build_sam2_video_predictor`), `sam2/sam2_image_predictor.py` (`SAM2ImagePredictor.predict(box=...)` → masks, IoU scores, low-res logits), `sam2/sam2_video_predictor.py` (`SAM2VideoPredictor`: streaming memory, per-`obj_id` multi-object tracking; `init_state`/`add_new_points_or_box`/`propagate_in_video`/`reset_state`).
- Models load via Hugging Face `from_pretrained('facebook/sam2.1-hiera-large')` or a Hydra config (`sam2/configs/sam2.1/*.yaml`) + checkpoint. Long-clip memory is controlled by `offload_video_to_cpu` / `offload_state_to_cpu` on `init_state`.
- Box derivation utilities: `sam2/utils/misc.py:mask_to_box`, `sam2/utils/amg.py:batched_mask_to_box`. The model resizes every frame internally to `image_size: 1024` — small/thin defects can be lost; tiling is the mitigation.

## Data artifacts (gitignored unless noted)

- `test_footage/` — source videos (gitignored; large). `label_review/` — transient frame dumps (gitignored). Both stay at the repo root as local-only scratch.
- `rovision/labelling/labels.json` — **the golden set, kept in git** (329 records). `*.bak`, `rovision/labelling/labeller_error.log` — gitignored.
- `rovision/dataset/` — amplified dataset (labels + frames); gitignored, the durable copy lives in Google Drive at runtime.
