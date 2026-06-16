# BOW-01: Notebook Export Extension
Goal: [[taskindex#Rovision Demo Development]]
Status: done

## Description
Extend the §17 cell of `subsea_defect_demo.ipynb` so it emits a self-contained
**bundle** per video — the GPU↔replay seam. This is what the offline Colab run hands to the
demo app: polygon-contour masks, a browser-seekable `raw.mp4`, and a `meta.json` describing the
clip-local frame indexing. Without this, the backend has nothing to ingest. Changes are purely
**additive** (nothing existing in §17 is removed).

## Dependencies
None. This is the head of the chain (BOW-01 → [[BOW-02-Backend]]).

## Subtasks
- [[ST-01.1-Polygons-Meta-And-Clip-Local-Reindex]] — add `mask_to_polygons`, clip-local re-index, write `meta.json`.
- [[ST-01.2-Raw-Clip-Encode-And-Fixture-Capture]] — faststart `raw.mp4` encode, re-run a hero clip, capture the fixture bundle.

## Context
- [[InferenceOutputs]] — the detection/track card schema this extends with `polygons`.
- [[DR-008-Selective-SAM2-Refinement-Cadence]] — why polygons attach only on refine frames.
- [[DR-009-Mask-Hold-Rendering]] — the held-mask model the polygons feed.
- [[subsea_defect_demo.ipynb]] — the notebook being edited.
