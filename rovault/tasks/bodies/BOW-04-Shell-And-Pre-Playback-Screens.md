# BOW-04: Shell And Pre-Playback Screens

Status: done
Progress: done

## Description
Build the application shell and every screen that precedes playback: the two-state sidebar, the
video library, the upload + parameter modal and its processing state, the dashboard (4 metric
cards), and the full-width expandable work-order list. Flags, severity, and work orders are
computed **client-side** from `tracks` + `/api/config` thresholds so the omitted-classes/asset
filters apply live; the backend rollup is only for library tiles.

## Dependencies
- [[BOW-03-Frontend-Foundation]] — uses the stores, types, API client, router, and `lib/severity.ts`.
- [[BOW-02-Backend]] — `/upload`, `/videos`, `/config` for live data (fixture covers dev otherwise).

## Subtasks
- [[ST-04.1-Sidebar-And-Library]] — two-state sidebar + video library.
- [[ST-04.2-Upload-Parameter-Modal-Processing]] — upload + asset/param modal + processing state.
- [[ST-04.3-Dashboard-Metric-Cards]] — 4 equal metric cards from client-side rollup.
- [[ST-04.4-Work-Order-List]] — full-width expandable rows + jump-to-track links.

## Context
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — why a flag = one tracked instance (severity is flicker-proof).
- [[InferenceOutputs]] — the track cards feeding flags/severity/work orders.
