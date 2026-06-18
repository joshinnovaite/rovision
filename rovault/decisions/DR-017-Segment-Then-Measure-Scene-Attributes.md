# DR-017: Segment-Then-Measure for Scene-Level Attributes (Sky / Water State)

## Context
E1's exogenous value to `boat-net` ([[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]]) includes **scene
state** the telemetry cannot see — is the sky clear or overcast, is the water glassy / rippled / choppy.
These are **frame-level scene properties**, not objects: an object detector cannot represent "overcast" or
"choppy" because there is no bounded instance to box. The vault had **no prior position** on scene-level
vs per-object analysis — this is genuinely new ground for the project.

Two existing assumptions are in tension with this need. [[DR-001-Detect-Then-Segment-Architecture]] orders
the pipeline **detect → segment** (a detector proposes boxes, SAM 2 refines masks).
[[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] assumes the output unit is a **tracked per-object
instance**. A scene attribute is neither detector-proposable nor a tracked instance.

## Decision
Introduce **"segment-then-measure"** — a new technique for scene-level attributes that **inverts**
DR-001's ordering for this one path and yields a **frame-level scalar attribute** instead of a tracked
instance. Mechanism:
1. Use SAM 2's **promptability** to mask a **sky region** and a **water region** from coarse box prompts
   (no detector, no class — SAM 2 is the class-agnostic segmenter it always was, see [[sam2-as-engine]]).
2. Read a **cheap classical descriptor** off each mask: **sky → clear/overcast** via blue-ratio +
   saturation; **water → glassy/rippled/choppy** via Laplacian high-frequency energy.

It is implemented as a **notebook bolt-on** — a new **§18** in [[subsea_defect_demo.ipynb]], gated on
`DOMAIN=='e1'`. It does **not** feed YOLO, is **not** a domain mode, and does not touch the
detect→segment instance path.

## Rationale
- **Detectors can't represent diffuse scene state**, but SAM 2 can be *pointed at* a region without
  knowing its class — so segment-first is the natural inversion. A classical descriptor (ratios, Laplacian
  variance) is cheap, interpretable, and adequate for a proof-of-capability; no second model to train.
- **Why a bolt-on, not a mode.** Making scene-state a domain mode would force the architecture change
  DR-016 / [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] explicitly avoid under deadline. A gated
  notebook section keeps it isolated and Phase-0-disposable.
- **Why frame-level, not a track.** A scene attribute is a property of the *whole frame over time*, not of
  a moving object; forcing it into the [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] instance
  model would be a category error.

## Consequences
- **A second analysis path now exists** alongside detect→segment: a segment-then-measure path producing
  frame-level scene descriptors. Future scene-level attributes (e.g. start-line state, course orientation)
  should extend this path, not the instance pipeline.
- **Calibration findings (real E1 footage, §18b sweep).** The technique works, but **fixed rectangular
  prompt boxes are scene-contaminated** in busy race footage — boats, wakes, hull, terrain and AR graphics
  land in the sky/water boxes and spike the descriptors. Reliable signals: **sky brightness** (open sky is
  readable only on the **onboard** camera — broadcast wide/close framing fills the top band with
  mountainside, so 4 of 5 clips read "no open sky") and **water specular fraction** (cleanly separates calm
  vs wake-wash / whitewater). **Laplacian roughness is too contaminated** to support a trustworthy
  glassy/rippled/choppy chop scale, so water shipped as an **honest binary (calm / wake-wash)** and the
  3-level chop scale was **deferred** pending better region selection (subtract the YOLO boat/spray boxes we
  already have; take the largest water-coloured connected component; robust median over more frames).
- **Calibrated thresholds:** sky `clear` if median brightness ≥ 0.45 AND blue_ratio ≥ 0.33 AND
  saturation ≥ 0.15, else `overcast` if bright, else `no_sky`; water `wake-wash` if median
  specular_frac ≥ 0.30 else `calm`. (These supersede the original uncalibrated first-guesses.)
- This is the natural home for the **scene/context mode** that DR-016 deferred to Phase 1
  ([[DR-018-E1-Phase-0-Phase-1-Split]]): Phase 1 can promote these descriptors into a first-class output
  surface and, eventually, time-align them to `boat-net` telemetry.
- DR-001 and DR-007 are **not overturned** — they remain the rule for *object* detection; segment-then-
  measure is a deliberately scoped exception for *scene* attributes.

## Related
- [[DR-001-Detect-Then-Segment-Architecture]] — the ordering this path inverts (for scene state only).
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — the per-instance assumption this path departs from.
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — why scene state rides a bolt-on, not a new mode.
- [[DR-018-E1-Phase-0-Phase-1-Split]] — Phase 1 promotes this into a first-class surface.
- [[DR-019-Scene-Attribute-Aggregate-Badge-Surface]] — how these calibrated descriptors are surfaced in the app (per-clip meta.json badge).
- [[sam2-as-engine]] — SAM 2's class-agnostic promptability, used to mask sky/water.
- [[subsea_defect_demo.ipynb]] — §18, the gated bolt-on.
- [[BOW-10-E1-Phase-0-Proof-Of-Capability]] — the body of work.
