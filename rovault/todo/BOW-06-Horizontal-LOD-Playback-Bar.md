# BOW-06: Horizontal LOD Playback Bar

Status: done
Progress: done — implemented directly; vault catching up. Visual confirmation by the user pending ([[ST-06.9-Vault-Docs-And-Visual-Verification]]).

## Description
Replace the vertical scrolling playback timeline ([[ST-05.3-Vertical-Timeline]]) with a
**horizontal, continuously-zoomable "playback bar card"** beneath the landscape video, applying
**level-of-detail (LOD) density clustering** to the flag cards. New capabilities: continuous zoom
(pinch + buttons), LOD density clustering of flag cards, two indicator modes (**Tracked** / **Static**),
a playback-speed control, density-card expansion with **snap-to-zoom**, and a max-zoom
"deck-of-cards" hover.

The defining discipline (inherited from [[BOW-05-Playback]] / the overlay): **recompute clusters only
on zoom-scale change; pan and playback are pure CSS transforms applied imperatively via a store
subscription — zero React re-render on play / scrub / pan.** See [[DR-011-LOD-Density-Cluster-Timeline]]
for the full rationale (n is tiny so the clustering math is free; the render is the real cost).

## Dependencies
- [[BOW-05-Playback]] — builds on the playback screen, the imperative-overlay pattern, the
  asset/work-order behaviours, and the down-sample wiring; this BOW **swaps the timeline** within it.
- [[BOW-03-Frontend-Foundation]] — stores, `track_cards`, geometry/down-sample utils reused.

## Subtasks
- [[ST-06.1-Horizontal-Playback-Bar-Card]] — the bar shell beneath the video; replaces the vertical strip.
- [[ST-06.2-Continuous-Zoom-Gestures]] — pinch-about-cursor + zoom buttons; @use-gesture wheel routing.
- [[ST-06.3-Deterministic-Cluster-Algorithm]] — the two-pass mean-centred clusterer + unit tests.
- [[ST-06.4-Recompute-On-Zoom-Imperative-Pan-Play]] — recompute on scale change; imperative transform for pan/play.
- [[ST-06.5-Indicator-Modes-Tracked-Static]] — Tracked vs Static wheel/indicator behaviour.
- [[ST-06.6-Density-Card-Expansion-Snap-To-Zoom]] — density-card click → snap auto-zoom + select.
- [[ST-06.7-Max-Zoom-Deck-Of-Cards-Hover]] — terminal no-cluster hover-protrude stack.
- [[ST-06.8-Cluster-Set-Transition]] — minimal transition (hover-protrude only); FLIP deferred.
- [[ST-06.9-Vault-Docs-And-Visual-Verification]] — vault docs (this BOW) + pending user eyeball.

## Context
- [[DR-011-LOD-Density-Cluster-Timeline]] — the decision record: horizontal LOD bar, recompute-on-zoom-only
  + imperative pan/play, deterministic two-pass clusterer, terminal max-zoom, @use-gesture.
- [[DR-009-Mask-Hold-Rendering]] — the imperative-mutation / zero-hot-path-render lineage reused here.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — a flag = one tracked instance.
- [[InferenceOutputs]] — `track_cards` (`first_frame`) are the flags the bar positions and clusters.
