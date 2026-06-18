# DR-019: Surface Scene State as a Per-Clip Aggregate Badge (meta.json, No New Mode)

## Context
[[DR-017-Segment-Then-Measure-Scene-Attributes]] produces frame-level sky/water descriptors; [[DR-018-E1-Phase-0-Phase-1-Split]]
set "scene visible" as a Phase-0 goal while deferring the standalone scene/context **surface** to Phase 1.
The open question for Phase 0 was **how to show scene state in the existing app** without (a) introducing a
new domain `mode`, (b) a schema migration, or (c) bending the per-track / timeline surface — which
[[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] (mode = UI branching only) and DR-017 (scene = a
frame-level attribute, not a track) both argue against. The §18b calibration sweep also established that
scene state is, in practice, a **per-clip property** for these clips (one camera framing per clip), not a
per-frame timeline signal worth scrubbing.

## Decision
Surface scene state as a **per-clip aggregate badge carried in the bundle's `meta.json`**:
`scene: {sky_state, water_state, method, metrics}`. The backend reads it in `GET /api/videos/{hash}`
(**meta.json read, not a DB column — no schema migration**), and a new **data-driven `SceneBadge`** in
`VideoHeader.tsx` renders it **only when scene data is present**. Subsea and insulators bundles carry no
`scene` block, so they are untouched. No new app `mode`, no per-track/timeline surfacing.

## Rationale
- **No new mode** keeps faith with DR-013 (mode is UI branching only) and DR-016, which deliberately put E1
  on inventory mode; a `scene` mode is Phase-1 work.
- **meta.json, not a schema migration** — the scene block is a small per-clip aggregate; piggy-backing on
  the bundle metadata the backend already serves is the cheapest seam and keeps other domains migration-free.
- **Presence-gated rendering** means one component serves all domains: data drives the UI, so subsea /
  insulators get nothing extra and E1 gets the badge for free.
- **Aggregate badge, not a track/timeline** — a scene attribute is a property of the whole clip
  (DR-017's "frame-level, not an instance"); the calibration sweep confirmed one stable framing per clip, so
  an aggregate badge is the honest surface and a timeline would over-promise resolution the signal lacks.

## Consequences
- A **bundle `meta.json` `scene` contract** now exists (`sky_state`, `water_state`, `method`, `metrics`),
  consumed by the backend and `SceneBadge`. Future scene attributes extend this block, not the track model.
- For the 5 current clips the block was **patched in locally** off the §18b sweep; folding the producer so
  §17 **auto-emits** `scene` is left as an **open follow-up** (ST-10.11) — the only Phase-0 item still open.
- DR-018's Phase-0 "scene visible" goal is **met without** the Phase-1 standalone surface; Phase 1 can still
  promote these descriptors into a first-class, time-alignable surface later.
- This is the **app-side companion** to DR-017's calibration refinements (see DR-017 "Calibration findings"):
  water ships as an honest **binary** (calm / wake-wash) and the badge reflects that, not a 3-level chop scale.

## Related
- [[DR-017-Segment-Then-Measure-Scene-Attributes]] — the scene technique + calibration findings this surfaces.
- [[DR-018-E1-Phase-0-Phase-1-Split]] — realises Phase-0 "scene visible"; standalone surface stays Phase 1.
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — mode = UI branching only; no new mode introduced.
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — E1 on inventory mode; scene rides outside the mode.
- [[subsea_defect_demo.ipynb]] — §18/§18b, the producer of the scene block.
- [[BOW-10-E1-Phase-0-Proof-Of-Capability]] — the body of work.
