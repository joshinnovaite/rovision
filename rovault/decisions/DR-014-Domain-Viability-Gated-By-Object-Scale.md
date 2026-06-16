# DR-014: A Domain's Viability Is Gated by Object Scale, Shape, and SAM 2-Segmentability

> **CORRECTED — root cause retracted.** This DR blamed the repeated detector-training collapse
> (pylons, insulators v1/v2 — "loss falls but val mAP exactly 0") on object scale / shape /
> SAM 2-segmentability. **That was a red herring.** The true cause was a **leaked global bf16
> autocast** (from SAM 2 setup) corrupting YOLO's EMA validation weights —
> see [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]], which supersedes the root-cause
> claim below. This DR is **kept as a cautionary record** of a plausible-but-wrong hypothesis that
> survived several iterations via confirmation bias. The *secondary* points here remain valid (SAM 2
> mask quality affects amplified-label quality; `conductor` is awkward as thin boxes) — but they did
> **not** cause the zero-mAP collapse.

## Context
The multi-domain framework ([[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]) was exercised by
standing up a second domain — **aerial electricity pylons** ([[BOW-08-Pylon-ML-Pipeline]]). The pipeline
ran end-to-end: footage scanned, taxonomy locked, golden set labelled, SAM 2 amplification run, multiple
YOLO11n training runs. The detector **never learned** — mAP pinned at 0, `cls_loss` stayed high, zero
confident detections — even after progressively collapsing the taxonomy (5 classes → 4 → prominent-tower-only).

The data pipeline was proven sound: amplified boxes were tight and stable, `train_batch` labels were
correct. The failure was **purely a footage/object property**, not a recipe or tooling bug.

**Then the replacement domain ([[BOW-09-Insulators-Domain-Pipeline]]) hit the same wall, twice**, which
forced this DR to deepen beyond "object scale":

- **Insulators v1 — FAILED.** Close-up footage (brown ceramic disc-chains, distribution pole, lineman),
  taxonomy reduced to `insulator_string` + `conductor`, ~64 seed boxes → ~1561 amplified → trained. Result:
  mAP50 ≈ 0.08 and the model **collapsed to <0.01 confidence everywhere** — zero detections even on its own
  training frames at conf 0.01. The diagnosis was expensive: labels were correct (`train_batch0.jpg`
  verified), the proven subsea recipe reproduced the collapse, and amplified boxes were ~faithful to seeds.
  At the time we **(mis)attributed the collapse** to SAM 2 being unable to coherently segment the repetitive
  close-up ceramic disc-chains (oscillating between "each disc" and "the whole string"). That instability is
  real, but it was **NOT the cause of the zero-mAP collapse** — the actual cause was a leaked global autocast
  ([[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]]). The disc-chain SAM 2 instability survives
  only as a *secondary* note on amplified-label quality.
- **Insulators v2 — IN PROGRESS.** Pivot driven by that root cause: footage SAM 2 *can* segment coherently
  (the lineman/bridge clip), split into **9 short (<20s) single-pan clips** (maw_1–maw_9); added a **`worker`**
  class (hi-vis linemen — compact, solid, COCO-pretrained `person`); **dropped `conductor`** (geometry
  confirmed it intrinsically thin/elongated — median aspect 5.4:1, 42% of boxes >8:1 — box-hostile *and*
  SAM 2-fragmentation-prone). v2 taxonomy: `insulator_string` + `worker`.

## Decision
**Abandon the aerial-pylon domain** and replace it with a new **`insulators`** ("Pylon Insulators")
domain built on close-up insulator-inspection footage where the target objects are large, crisp, and
frame-filling — the opposite imaging regime. The `pylon` registry block and its local files
(`test_footage_pylon`, `labels_pylon.json`) are removed; the registry is now subsea + insulators. See
[[BOW-09-Insulators-Domain-Pipeline]].

Going forward, **screen a candidate domain's footage for detector viability before investing in labelling
+ amplification + training.**

## Rationale
- **The framework held up perfectly.** Adding or removing a domain — across an abandoned pylon domain and
  two insulator iterations — was a registry edit + footage + labels with **zero architecture change**,
  exactly [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]]'s intent. Every pivot validated the design; it
  did not implicate it.
- **SAM 2-segmentability is the UPSTREAM gate** (the insulators-v1 lesson). The amplification pipeline
  derives all YOLO training labels from SAM 2 masks ([[DR-002-SAM2-Propagation-For-Label-Amplification]]),
  so if SAM 2 cannot cleanly *and stably* segment the target, every downstream artifact is corrupt and **no
  recipe/label/epoch change recovers it**. This must be checked **before labelling**.
- **Object scale is necessary but not sufficient — shape matters too.** Aerial-pylon parts failed on scale
  (small/thin/distant, compounded by SAM 2's internal 1024px resize — see [[sam2-as-engine]]). But the
  close-up insulator strings were large and frame-filling and *still* failed in v1, because the issue was
  **shape and repetition**, not size. Compact, solid, visually-distinct objects (workers, solid insulator
  strings) train well. **Thin / elongated / diagonal / parallel-repeated** structures (conductors/cables,
  repetitive disc rows) fail two ways at once: **box-hostile for YOLO** (low-fill axis-aligned boxes starve
  positive-anchor assignment → the under-confident collapse) **and** prone to **SAM 2 fragmentation**.
- **Footage curation is the highest-leverage lever** — more than recipe, labels, epochs, or class count.
  Short, single-continuous-pan clips of compact SAM 2-friendly objects give stable propagation; the v2
  pivot to 9 short maw clips is exactly this.
- **Two taxonomy anti-patterns to avoid**, learned the hard way:
  - **Swarm classes** — dozens of tiny near-identical repeats per frame (e.g. per-disc `insulator_disc`).
  - **Sparse classes** — objects rarely visible in the shot framing (e.g. `foundation` in elevated shots).
- **Prefer COCO-pretrained, box-friendly classes where available.** v2 added `worker` (hi-vis linemen) —
  compact, solid, and a `person` the backbone already knows — the most reliable class available.
- Overfit-by-design ([[DR-005-Overfit-By-Design-PoC-Scope]]) cannot rescue objects the detector cannot
  resolve, nor a training set built on unstable masks.

## Consequences
- A **domain/footage viability screen** becomes a precondition of any future domain BOW, ahead of
  labelling — now codified as a reusable checklist + diagnostic playbook in
  [[domain-viability-and-detector-diagnostics]]. The screen is **two-stage**: (1) SAM 2-segmentability
  (run the object through the HF SAM 2 demo or an amplification-overlay spot-check — coherent, stable
  masks?), then (2) object scale/shape (compact + solid + well-separated, not thin/repeated). ST-08.1's
  "extract-only review" judged class *presence* only; both screens are now explicit and upstream.
- The insulators taxonomy is now **v2: 2 classes — `insulator_string` + `worker`** (in
  `rovision/domains.json`). The v1 set (`insulator_string` + `conductor`) and the earlier 4-class set are
  superseded; `conductor` is **dropped** (thin/elongated, box-hostile + fragmentation-prone) but
  **preserved in a backup, re-addable**. `insulator_disc` (swarm) and `foundation` (sparse) remain excluded.
- The **failure signature is now documented and recognizable**: mAP ≈ 0 + `cls_loss` plateauing high (~2–3)
  + zero detections at low conf on *training* data = positive-anchor starvation from low-fill / unstable
  boxes. See the playbook for the ordered diagnostic.
- **Operational gotcha:** the labeller **appends** to `labels_<domain>.json` — curate/clear it between
  footage changes or orphaned cross-pass labels accumulate (hit during the v1→v2 footage swap).
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] **remains valid and unchanged** — reinforced by
  every pivot here; insulators is still inventory mode. This DR is a learning *layered on top of* DR-013.
- BOW-08 and its subtasks are preserved as an **abandoned/superseded** record (not deleted), pointing here.

## Related
- [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — **the true root cause; supersedes this DR's root-cause claim.**
- [[domain-viability-and-detector-diagnostics]] — the reusable checklist + diagnostic playbook distilled here.
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — the framework these pivots validated; unchanged.
- [[DR-002-SAM2-Propagation-For-Label-Amplification]] — why corrupt SAM 2 masks poison the whole training set.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — overfitting cannot rescue unresolvable objects or unstable masks.
- [[sam2-as-engine]] — the 1024px internal resize, and SAM 2's class-agnostic instability on repeated structures.
- [[BOW-08-Pylon-ML-Pipeline]] — the abandoned aerial-pylon work.
- [[BOW-09-Insulators-Domain-Pipeline]] — the insulators domain (v1 failed → v2 in progress).
