# BOW-05: Playback

Status: done
Progress: done

## Description
Build the playback screen: the video stage with an SVG overlay (boxes + polygon masks), the
frame-sync rAF loop with mask-hold and live down-sample wiring, the vertical scrolling timeline
(window / scroll-scrub / click-snap), and the asset dropdown behaviours plus playback work-order
chips. The defining performance constraint: **zero React renders in the ~50fps hot path** — the
overlay subscribes imperatively and mutates shape refs.

## Dependencies
- [[BOW-03-Frontend-Foundation]] — stores, `FrameIndex`/`HeldMaskTimeline`, geometry/down-sample utils, `lib/assets.ts`.
- [[BOW-02-Backend]] — range-seekable `/clip` (for real seeking) and `/detections`.

## Subtasks
- [[ST-05.1-Video-Stage-And-SVG-Overlay]] — video stage + SVG boxes/polygons, viewBox scaling, selection.
- [[ST-05.2-Frame-Sync-Mask-Hold-Downsample]] — rAF frame-sync + imperative mask-hold + live down-sample.
- [[ST-05.3-Vertical-Timeline]] — window geometry, scroll-scrub, click-snap.
- [[ST-05.4-Asset-Behaviours-And-Playback-Work-Orders]] — asset dropdown filter/jump/dim + playback work-order chips.

## Context
- [[DR-009-Mask-Hold-Rendering]] — why masks are held between refine frames.
- [[DR-008-Selective-SAM2-Refinement-Cadence]] — the refine cadence the down-sampler quantizes against.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — `selectedTrackId` ties card and overlay highlight.
- [[InferenceOutputs]] — per-frame geometry and track cards rendered here.
