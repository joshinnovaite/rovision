# DR-013: Multi-Domain Support via a Shared Domain Registry + Inventory Mode

## Context
The demo was single-domain (subsea defect inspection). We want to host a **second domain — electricity pylons** — in the *same* app behind a sidebar toggle, without forking the codebase. The two domains are not just "different class lists": pylons are an **asset-inventory** problem (detect structural *components*), not a defect problem — there is no severity, no flags, no work orders.

A complicating fact predates this work: the subsea taxonomy was duplicated in **~4 places** (labeller, notebook §15, backend `config.py`, frontend `classColors.ts`/`assets.ts`) — the very "keep N copies in sync" hazard [[DR-003-Defect-Taxonomy-Consolidation]] already warned about. Adding a domain naively would multiply that hazard.

## Decision
Introduce a first-class **`domain`** concept end-to-end, driven by a single canonical registry committed at `rovision/domains.json` — the new **single source of truth** for taxonomy, defect-subset, per-class colours, asset lenses, and severity thresholds, keyed by domain. The backend loads it; the frontend consumes it via `/api/config?domain=` (plus a new `/api/domains`); the labeller and notebook are to read it too (Track B). This supersedes the four hardcoded taxonomy copies.

Each domain carries a **`mode`** field capturing its *kind*:
- **`"defect"`** (subsea) — keeps the existing severity / flags / work-order machinery unchanged.
- **`"inventory"`** (pylon) — detects components, not defects. Pylon's `defect_classes` is **empty**, so `compute_rollup`/`isFlag` naturally yield zero flags; severity, flags, and work orders are suppressed and the UI shows **component counts** instead. The frontend branches on `mode` for the dashboard, video header, library tiles, and overlay/timeline dimming (in inventory mode **all classes are primary**, so nothing is dimmed).

**Data model:** add a `domain` column to the `videos` table (`NOT NULL DEFAULT 'subsea'`), with an **in-place startup migration** in `db.py` so existing catalogs upgrade and legacy rows/bundles default to subsea. The §17 bundle `meta.json` gains a `"domain"` field (read by ingest). **Toggle UX:** a persistent segmented control at the top of the sidebar filters the library and swaps the active taxonomy/colours; the selection is **sticky** (localStorage).

## Rationale
- **Registry vs per-domain duplication.** Duplicating config per domain would *multiply* the existing 4-copy sync hazard ([[DR-003-Defect-Taxonomy-Consolidation]]). A single keyed registry collapses it to one file — every consumer reads the same source.
- **Components-only inventory vs full defect-on-pylon semantics.** The demo's intent for pylons is "what components are present," not "is this pylon defective." Suppressing severity/flags via an empty `defect_classes` reuses the existing rollup machinery rather than adding a parallel code path — `mode` is a thin UI/branching switch, not a second engine.
- **Separate trained detector per domain.** The two domains never share a YOLO model; each is its own overfit-by-design model, consistent with [[DR-005-Overfit-By-Design-PoC-Scope]]. There is no cross-domain transfer to preserve.

## Consequences
- The registry becomes a **load-bearing artifact**: all four former copies must be retired against it (frontend/backend done in Track A; labeller + notebook in Track B). Drift now shows up as one file being stale rather than four disagreeing.
- A new `mode`-conditional axis runs through the frontend (dashboard, header, tiles, overlay/timeline). Future per-domain UI differences should ride `mode`, not new `if (domain === 'pylon')` checks.
- The startup migration makes the DB **forward-only**: old catalogs silently gain `domain='subsea'`; there is no down-path, which is acceptable for a local demo DB.
- **Relationship to existing DRs:** builds on [[DR-003-Defect-Taxonomy-Consolidation]] (the subsea 15-class list now lives in the registry's `subsea` block, **unchanged**); consistent with [[DR-005-Overfit-By-Design-PoC-Scope]] (each domain is its own overfit model on its own footage). Does **not** change [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] (inventory still tracks instances; a component is a tracked instance) or [[DR-011-LOD-Density-Cluster-Timeline]] (the bar reads `tracks` regardless of mode — in inventory mode every track is primary, so the dimming layer is simply inert). **No tension found:** inventory mode is a suppression/branching layer over the existing engine, not a competing architecture.

## Related
- [[DR-014-Domain-Viability-Gated-By-Object-Scale]] / [[DR-015-Leaked-Global-Autocast-Corrupted-Detector-Training]] — this framework, exercised: the aerial-pylon→insulators pivot validated it (remove/add a domain = a registry edit; insulators shipped as registry edits only, zero architecture change). The detector collapse that drove the churn turned out to be a leaked-autocast bug (DR-015), not the object-scale gate DR-014 first proposed.
- [[DR-003-Defect-Taxonomy-Consolidation]] — the subsea taxonomy this preserves and relocates into the registry.
- [[DR-005-Overfit-By-Design-PoC-Scope]] — each domain is its own overfit model.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — unchanged; a component is a tracked instance.
- [[DR-011-LOD-Density-Cluster-Timeline]] — unchanged; the bar reads `tracks`, dimming inert in inventory mode.
- [[BOW-07-Multi-Domain-App-Architecture]] — Track A, the implemented application work.
- [[BOW-08-Pylon-ML-Pipeline]] — Track B, the gated pylon pipeline.
- [[DR-016-E1-Domain-As-Inventory-Mode-Phase-0]] — this framework exercised a third time: E1 (race footage) registered as inventory mode, zero architecture change.
