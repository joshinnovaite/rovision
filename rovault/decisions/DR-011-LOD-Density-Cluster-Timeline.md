# DR-011: LOD Density-Cluster Timeline

## Context
The footage is **landscape**, but the BOW-05 playback timeline ([[ST-05.3-Vertical-Timeline]]) was a *vertical* scrolling strip — a fixed-window orientation mismatch that wasted horizontal screen and fought the natural reading axis of the video. It also showed only a moving window, so an operator could not see the whole clip's defect distribution at once, and at any reasonable zoom the flag cards (one per tracked instance, ~192 of them) congested and overlapped where defects cluster in time.

A horizontal, zoomable bar was wanted instead — full-clip overview when zoomed out, individual flags when zoomed in — which forces a decision on *how* to collapse many overlapping flags into legible markers at low zoom, and *how* to keep gesture-driven zoom/pan/playback smooth.

## Decision
Replace the vertical timeline with a **horizontal, continuously-zoomable "playback bar card"** beneath the video that applies **level-of-detail (LOD) density clustering** to the flag cards. Concretely:

- **Recompute clusters only when the zoom *scale* changes.** Pan and playback never recompute — they are pure CSS transforms applied **imperatively** via a `playbackStore` subscription, so play / scrub / pan trigger **zero React re-render** (same imperative-mutation discipline as [[DR-009-Mask-Hold-Rendering]] / the `OverlayLayer`).
- **Cluster with a deterministic two-pass algorithm** (`lib/timelineClusters.ts`): (1) greedy proximity grouping in **pixel space** (grid-independent), then (2) a **mean-centred de-overlap relaxation** enforcing `pos[i] ≥ pos[i-1] + cardWidth + gap`. Recomputed from scratch at each zoom level; pop-out of singletons emerges automatically as scale rises.
- At **maximum zoom** clustering terminates — every flag is a singleton — and a "deck-of-cards" hover-protrude reveals stacked detail.
- Gestures via **@use-gesture/react** (pinch zoom about the cursor; wheel scrubs in *Tracked* mode / pans in *Static* mode; ctrl+wheel routes to pinch). Two indicator modes (Tracked / Static), a playback-speed control, and density-card expansion with **snap-to-zoom** round out the bar.

## Rationale
The key reframe: **n is tiny (~192 tracks), so the clustering math is microseconds — the real cost is the React re-render on every gesture frame.** That inverts the usual "make clustering cheap" instinct into "make *rendering* cheap": cluster rarely (only on scale change), and drive the per-frame motion imperatively. This is the [[DR-009-Mask-Hold-Rendering]] lineage applied to the timeline.

The clusterer **replaced the user's original fixed-bin + mean-shift idea**, which was grid-dependent (results jumped as markers crossed bin edges), mean-unstable, and gave no guarantee against overlap (hence flicker/hysteresis at boundaries). The chosen two-pass method is provably non-overlapping and deterministic — same input scale, same output, no hysteresis. Crucially the **de-overlap relaxation is the salvaged core of the user's "shift the mean to make space" instinct**, reframed from a stochastic bin process into a single deterministic monotone pass. It is a ~30-line in-repo module — **no clustering dependency** added — and is unit-tested for non-overlap, determinism, and monotonic singletons (`lib/timelineClusters.test.ts`).

The bar reads **`tracks` (each track's `first_frame`), not per-frame detections** — so the detector/SAM 2 down-sample sliders (a [[ST-05.2-Frame-Sync-Mask-Hold-Downsample|down-sample]] concern) never move a flag. It shows **all non-omitted tracks** (artefacts dimmed; the asset lens dims off-asset further), keeping the overview honest. Snap-to auto-zoom uses precomputed nearest-neighbour gaps: required scale = `(cardWidth + gap) / gapSeconds`, clamped — it zooms until the target is a singleton, then snaps and selects.

## Consequences
- Cluster marker positions are **deterministic and provably non-overlapping**; there is no flicker from cluster membership churn, but cluster sets **snap** at each zoom level rather than animating.
- Full **FLIP position animation between cluster sets was deliberately deferred** (recorded in [[ST-06.8-Cluster-Set-Transition]]) — animating positions during a continuous pinch caused "smear", and the deterministic snap is acceptable for the demo. Only hover-protrude is animated (CSS transform). FLIP remains future polish.
- This **supersedes the vertical-timeline aspects of [[ST-05.3-Vertical-Timeline]]** / the BOW-05 timeline; `VerticalTimeline.tsx` was removed and the store's `windowSeconds` field retired in favour of a timeline slice (`scale / mode / viewStartTime / barWidthPx / durationSec / encFps / playbackRate`).
- The renderer now carries a timeline-geometry concern alongside the overlay, but both follow the same "no React render in the hot path" rule, so the performance budget is preserved.
- **Adaptive time ruler (later enhancement).** The bar gained tick marks + `m:ss` labels spaced ~every 90px,
  so position is readable even when no flags/components sit near the playhead (the cluster markers alone left
  long unlabelled stretches). Ticks are **recomputed only on zoom** (same recompute-on-scale-change
  discipline as the clusters — never on pan/play), keeping the hot path render-free.

## Related
- [[DR-009-Mask-Hold-Rendering]] — the imperative-transform / zero-hot-path-render discipline this reuses.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — a flag = one tracked instance; the bar reads `tracks`, not detections.
- [[InferenceOutputs]] — `track_cards` (`first_frame`) are the flags the bar positions and clusters.
- [[BOW-06-Horizontal-LOD-Playback-Bar]] — the body of work that implemented this.
- [[ST-05.3-Vertical-Timeline]] — the vertical predecessor this supersedes.
