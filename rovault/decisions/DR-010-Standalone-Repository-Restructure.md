# DR-010: Standalone Repository Restructure

## Context
The repository began as a **fork of Meta's SAM 2** (`facebookresearch/sam2`), carrying the rovision project as a layer on top while tracking Meta upstream via an `upstream` git remote (see the prior [[repository-topology]]). As rovision matured into its own project — with a future private/closed-source hardening pass anticipated — the fork relationship stopped paying for itself: there were no rovision changes to upstream, and pulling Meta updates was not worth the cost of maintaining a fork identity and a two-layer mental model.

## Decision
Convert the repository from a fork into a **standalone Rovision project** that *vendors* SAM 2 as a pristine dependency:

- **Cut the fork.** Remove the `upstream` remote (→ `facebookresearch/sam2`); keep only `origin` (`joshinnovaite/rovision`). No more Meta merges.
- **Vendor `sam2/` pristine.** Retain the `sam2/` Python package unchanged (it is the segmentation/tracking engine the pipeline imports), but delete all SAM 2 demo/research/training/eval scaffolding: `demo/`, `training/`, `sav_dataset/`, `assets/`, the upstream example notebooks, `tools/vos_inference.py`, and Meta community/docs/CI files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `INSTALL.md`, `RELEASE_NOTES.md`, `backend.Dockerfile`, `docker-compose.yaml`, `.watchmanconfig`, `.clang-format`, the CI fmt-check workflow).
- **Consolidate rovision code under a top-level `rovision/` directory:** `rovision/labelling/` (the local `label_defects.py`, its requirements, and the `labels.json` golden set), `rovision/notebooks/subsea_defect_demo.ipynb`, and `rovision/dataset/` (gitignored amplified dataset; durable copy on Drive). These previously lived in `tools/` and `notebooks/`.
- **Rebrand packaging/docs:** `setup.py` name `SAM-2` → `rovision`; the README is a Rovision README carrying a "Built on Meta's SAM 2 (Apache-2.0)" attribution; `CLAUDE.md` reframed from "two-layer fork" to "standalone project vendoring SAM 2".

## Rationale
Rovision is now its own project, so a fork's defining benefit — sending changes back upstream or merging Meta's down — no longer applies. A clean standalone identity also clears the path to the planned private repo. SAM 2 is kept *untouched* rather than surgically trimmed because third-party code is treated as a dependency, not something to edit: leaving `sam2/` whole avoids subtle import breakage and keeps provenance clean. Apache-2.0 compliance is preserved deliberately — `LICENSE` and `LICENSE_cctorch` are kept, per-file copyright headers in `sam2/` are untouched, and the README carries explicit attribution — so the vendoring is license-correct.

Only structured, committed rovision content (plus `dataset/`, a structured pipeline artifact) was moved under `rovision/`. Transient gitignored scratch — `test_footage/` (source videos) and `label_review/` (frame dumps) — was deliberately left at repo root, because moving uncommitted content is pure churn.

## Consequences
- **No `upstream` remote and no Meta merges.** Future SAM 2 updates would have to be pulled in manually as a deliberate vendoring refresh, not an automatic merge.
- **`sam2/` is a frozen vendored dependency.** It is not edited; the previous "rarely edited" framing becomes "treated as immutable."
- **All rovision paths moved under `rovision/`.** `tools/labels.json` → `rovision/labelling/labels.json`; `tools/dataset/` → `rovision/dataset/`; `tools/label_defects.py` → `rovision/labelling/label_defects.py`; `notebooks/subsea_defect_demo.ipynb` → `rovision/notebooks/subsea_defect_demo.ipynb`. The notebook's golden-set path and its Colab clone fallback (now `joshinnovaite/rovision`, which vendors SAM 2) were updated to match.
- This restructure is orthogonal to the pipeline-design decisions (DR-001..DR-009): it relocates and rebrands, but does not change the detect→segment architecture, amplification, taxonomy, or training scope.

## Related
- [[repository-topology]]
- [[GoldenSet]]
- [[AmplifiedDataset]]
- [[label_defects.py]]
- [[subsea_defect_demo.ipynb]]
