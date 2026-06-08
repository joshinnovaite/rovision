# DR-007: Tracked Instances Over Per-Frame Detection

## Context
The capstone detect→segment demo (§17 of [[subsea_defect_demo.ipynb]]) renders the [[detect-then-segment]] pipeline on footage. The first cut called `model.predict` independently per frame. This produced flickering boxes — confidence hugging the threshold made the same defect blink in and out — plus redundant duplicate boxes for one defect, and there was no notion of "the same defect across frames." The downstream artefact is meant to be one entry per real-world defect, not N detections.

## Decision
Use the detector in tracking mode — `model.track(persist=True)` (ByteTrack) — so each defect carries a stable `track_id`, and apply a two-pass track → filter → render: tracks shorter than `MIN_TRACK_LEN` frames are dropped before rendering.

## Rationale
ByteTrack supplies temporal identity and smoothing that independent per-frame inference cannot: a defect keeps one `track_id` across frames, killing both the flicker and the duplicate-box problem. The short-track filter removes residual blips — momentary false positives that never persist long enough to be a real instance — which a single confidence threshold could not cleanly reject. The two-pass structure is required because "is this track long enough" can only be answered once the whole track is known.

## Consequences
Each defect collapses from many per-frame rows into ONE tracked instance, which is the unit the per-instance [[InferenceOutputs|track cards]] summarise. Filtering is now a track-level property (`MIN_TRACK_LEN`), not a per-detection one. The framing assumes reasonably continuous footage; hard cuts or long occlusions can split one defect into multiple tracks.

## Related
- [[DR-001-Detect-Then-Segment-Architecture]]
- [[detect-then-segment]]
- [[InferenceOutputs]]
- [[subsea_defect_demo.ipynb]]
