# InferenceOutputs

The structured outputs of the §17 detect→segment demo (`detection_cards.json` and `track_cards.json`) — the machine-readable record of what was found in a run, distinct from the rendered overlay video. They sit at the end of the [[detect-then-segment]] pipeline, downstream of the detector and selective [[sam2-as-engine|SAM 2]] refinement.

Two grains, by design:

- **`detection_cards.json` — per-frame.** One row per detected instance per frame: `{frame, track_id, class, confidence, bbox, area_px?, coverage_frac?}`. `area_px` and `coverage_frac` are optional because they only exist on true SAM 2 frames (see [[DR-008-Selective-SAM2-Refinement-Cadence]]); box and class are present on every frame.
- **`track_cards.json` — per-instance.** One row per tracked defect: `{track_id, class, first_frame, last_frame, n_frames, peak_conf, peak_area_px}`. This is the collapse of many per-frame rows into ONE entry per real-world defect, made possible by ByteTrack identities (see [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]]).

Intent worth recording (the rest is readable in the JSON):

- **The per-frame file is the raw stream; the per-instance file is the summary.** `track_cards.json` is derived from the same tracked run, not a separate detection pass.
- **Track cards are the seed of the planned detection-cards rail.** The per-instance grain — one card per defect, carrying peak confidence and peak area — exists because each tracked instance is meant to become one reviewable card, not because the JSON needed flattening.
- **Measurements are sparse by construction.** Per [[DR-008-Selective-SAM2-Refinement-Cadence]], `area_px`/`coverage_frac` are populated only on refinement frames; `peak_area_px` therefore peaks over the SAM 2 frames within a track, not every frame.

These outputs only have meaning on in-distribution footage, because the detector is overfit by design (see [[DR-005-Overfit-By-Design-PoC-Scope]]).
