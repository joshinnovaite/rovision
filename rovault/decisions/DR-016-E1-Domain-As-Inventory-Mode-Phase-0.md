# DR-016: E1 Broadcast Footage as a Third Domain, Reusing Inventory Mode (Phase 0)

## Context
A third domain — **E1** (computer vision on E1 powerboat race **broadcast footage**) — joins the
existing subsea-defect and pylon-insulators domains. Its ultimate purpose is **exogenous**: to augment a
separate telemetry project, `boat-net` (an external repo), which already ingests Garmin Connect + E1
"VBox" telemetry into Postgres at 100 Hz (throttle %, steering, pitch/roll/yaw, GPS, speed, foil-height
`xLift`) and detects "key events" from those numbers alone. CV's role is the layer telemetry is blind to
— weather, water state, start line, course/track orientation — plus causal context for telemetry-flagged
events (what actually happened on the water). The `boat-net` connection is **deliberately deferred**
(see [[DR-018-E1-Phase-0-Phase-1-Split]]); this DR covers only how E1 is registered for **Phase 0**.

The tension: a race-footage domain wants **scene/context** understanding, which is a different *kind* of
problem from the `defect` and `inventory` modes [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]
established. The question was whether to introduce a new **`mode`** for it now.

## Decision
Register E1 in `rovision/domains.json` with **`mode: inventory`** — *not* a new mode — for Phase 0.
Classes: `race_boat`, `turn_buoy`, `spray_plume`; `defect_classes: []`; `severity: null`. E1 reuses the
inventory rails **verbatim**, exactly as `insulators` does ([[BOW-09-Insulators-Domain-Pipeline]]). The
"proper" scene/context mode is **explicitly deferred to Phase 1**.

## Rationale
- **`mode` is a UI/branching switch, not a second engine** ([[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]).
  Introducing a `context`/`scene` mode would force new frontend/backend branching — an **architecture
  change**, directly contradicting DR-013's zero-architecture-change principle and the deadline.
- **Inventory fits Phase 0's actual claim.** Phase 0 only needs to prove we can *detect race objects*
  (boats / buoys / plumes) — a components-present problem, which is precisely what inventory mode models
  (empty `defect_classes` ⇒ rollup yields zero flags, severity/work-orders suppressed). Scene-level
  attributes ride a separate notebook bolt-on ([[DR-017-Segment-Then-Measure-Scene-Attributes]]), not the
  domain mode, so they do not pressure the registry now.
- **Each domain is its own overfit detector** ([[DR-005-Overfit-By-Design-PoC-Scope]]) — E1 trains its own
  YOLO11n; no cross-domain transfer to preserve. Registering E1 is a registry edit, the cheap operation
  DR-013 was built to make possible.

## Consequences
- A third `e1` block in the load-bearing registry; all consumers (backend, frontend, labeller, notebook)
  read it unchanged. Adding E1 was a registry edit + footage + a trained model — **zero architecture
  change**, validating DR-013 a second time.
- **The scene/context mode is now a known deferral**, owned by Phase 1 ([[DR-018-E1-Phase-0-Phase-1-Split]]).
  Until then, "overcast"/"choppy" do **not** live in the domain mode — they are frame-level descriptors
  from the §18 bolt-on, outside the detect→segment instance model.
- A required supporting fix surfaced: notebook §12's `CLASS_LIST` was still hardcoded to the 15 subsea
  classes; it was repointed at `DOMAINS[DOMAIN]['all_classes']` + registry colours, completing DR-013's
  single-source-of-truth migration for that cell (without it, no non-subsea domain renders in §12).

## Related
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — the registry + `mode` framework reused here.
- [[DR-017-Segment-Then-Measure-Scene-Attributes]] — the scene-state path that sidesteps needing a new mode.
- [[DR-018-E1-Phase-0-Phase-1-Split]] — the roadmap; scene/context mode deferred to Phase 1.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — E1 is its own overfit model.
- [[BOW-09-Insulators-Domain-Pipeline]] — the inventory-domain precedent E1 mirrors.
- [[BOW-10-E1-Phase-0-Proof-Of-Capability]] — the body of work standing E1 up.
- [[subsea_defect_demo.ipynb]] — the §12 CLASS_LIST registry fix completed for E1.
