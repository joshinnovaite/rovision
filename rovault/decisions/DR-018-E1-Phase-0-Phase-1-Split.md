# DR-018: E1 Phase 0 / Phase 1 Split (the Governing Roadmap)

## Context
The E1 domain ([[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]]) ultimately exists to augment a **separate**
telemetry project, `boat-net` (external repo), which ingests Garmin + E1 "VBox" race telemetry at 100 Hz
and already detects key events from those numbers. CV supplies what telemetry is blind to (weather, water
state, start line, course/track orientation) and **causal context** for telemetry-flagged events. That is
a large surface — a standalone application plus a time-alignment layer that joins CV outputs to telemetry
on `(session, elapsed_ms)`. Trying to build all of it at once, under deadline, against the existing
demo's rails, would be reckless. A roadmap decision was needed to sequence the work and define the seam.

## Decision
Split E1 into **two phases** with an intentionally cheap seam between them:

- **Phase 0 — proof of capability.** Reuse the existing **label → propagate → train → demo** pipeline
  ([[pipeline-overview]]) in as close to current form as possible, to prove two things: (1) we can
  **detect race objects** (`spray_plume` / `turn_buoy` / `race_boat`), and (2) we can **read scene state**
  (sky/water) via [[DR-017-Segment-Then-Measure-Scene-Attributes]]. Runs on the existing app via inventory
  mode + the §18 notebook bolt-on. **This is the current phase.**

- **Phase 1 — standalone surface + (staged) `boat-net` connection.** Fan the work out into a **standalone
  application surface** (the proper home for scene/context, deferred from DR-016) and, **staged**, a
  **connection layer** that time-aligns CV outputs to `boat-net` telemetry on `(session, elapsed_ms)`.

## Rationale
- **Prove the capability before building the surface.** Phase 0 answers "can CV see the race objects and
  the scene at all?" cheaply, on rails that already work, before investing in a bespoke application or any
  cross-repo integration.
- **The phase 0→1 seam is deliberately cheap.** **Trained detectors + labelled/amplified data carry
  forward unchanged**; only the **orchestration/output layer** is rebuilt in Phase 1. Phase 0 therefore
  produces durable assets (a YOLO11n model, a golden set, an amplified dataset), not throwaway work.
- **Staging the `boat-net` connection** isolates the hard cross-repo, time-alignment problem behind a
  proven CV pipeline, so an integration failure cannot block the capability proof.

## Consequences
- Phase 0 is bounded to **reuse, not rebuild** — no new app surface, no `boat-net` coupling yet. The
  scene/context **mode** (DR-016) and the standalone surface (DR-017's eventual home) are **Phase-1 work**.
- Phase 0's deliverables are the **carry-forward assets**: an E1 YOLO11n detector, E1 golden/amplified
  data, and the §18 scene descriptors. Phase 1 consumes these; it does not re-derive them.
- The **time-alignment key** is pre-declared as `(session, elapsed_ms)` so Phase 0 outputs can be designed
  to be alignable later (a forward-looking constraint, not yet implemented).
- E1 training inherits the [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] guard
  (`with torch.autocast('cuda', enabled=False):`) already present in §16 — pre-flighted for the eventual
  E1 train, so the zero-mAP collapse cannot recur.

## Related
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — Phase 0 registration; scene mode deferred to Phase 1.
- [[DR-017-Segment-Then-Measure-Scene-Attributes]] — the scene path; Phase 1 makes it first-class.
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — the §16 guard E1 training inherits.
- [[pipeline-overview]] — the label→amplify→train→demo pipeline Phase 0 reuses.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — proof-of-capability scope, consistent with Phase 0.
- [[BOW-10-E1-Phase-0-Proof-Of-Capability]] — the Phase 0 body of work.
