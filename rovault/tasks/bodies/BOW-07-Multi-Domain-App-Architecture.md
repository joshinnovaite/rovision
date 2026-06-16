# BOW-07: Multi-Domain App Architecture

Goal: [[taskindex#Second domain — pylon insulators (multi-domain demo)]]
Status: done
Progress: done — Track A implemented and verified locally (backend registry/migration tested; frontend typechecks + builds). Track B ([[BOW-08-Pylon-ML-Pipeline]]) gated on footage.

## Description
Make the demo **multi-domain**: a first-class `domain` concept end-to-end, driven by the canonical
registry at `rovision/domains.json` (single source of truth for taxonomy, defect-subset, per-class
colours, asset lenses, severity thresholds, keyed by domain). Each domain carries a `mode` —
`"defect"` (subsea, existing severity/flags/work-orders) vs `"inventory"` (pylon, components-only:
empty `defect_classes` ⇒ zero flags; severity/flags/work-orders suppressed, UI shows component counts).
A sticky sidebar segmented toggle filters the library and swaps the active taxonomy/colours.
See [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] for the full rationale.

## Dependencies
- [[BOW-02-Backend]] — extends `config.py`, `schema.sql`, `db.py`, `ingest.py`, `rollup.py`, `main.py`.
- [[BOW-03-Frontend-Foundation]] — extends types, api client, stores, class-colour/asset/severity utils.
- [[BOW-04-Shell-And-Pre-Playback-Screens]] — sidebar, dashboard, upload parameter modal.
- [[BOW-05-Playback]] / [[BOW-06-Horizontal-LOD-Playback-Bar]] — overlay + playback-bar dimming branch on `mode`.

## Subtasks
- [[ST-07.1-Domain-Registry-domains-json]] — author the canonical `rovision/domains.json`.
- [[ST-07.2-Backend-Domain-Plumbing]] — config/schema/migration/ingest/rollup + `/api/domains`, domain params.
- [[ST-07.3-Frontend-Domain-State-And-Sidebar-Toggle]] — domain state, `setDomain`/`loadDomains`, sticky toggle.
- [[ST-07.4-Inventory-Mode-UI-Branching]] — `mode`-conditional dashboard/header/tiles/overlay/timeline.

## Context
- [[DR-013-Multi-Domain-Registry-And-Inventory-Mode]] — the decision: registry + `mode` + migration.
- [[DR-003-Defect-Taxonomy-Consolidation]] — the subsea taxonomy, now relocated into the registry unchanged.
- [[DR-007-Tracked-Instances-Over-Per-Frame-Detection]] — unchanged; a component is a tracked instance.
- [[DR-011-LOD-Density-Cluster-Timeline]] — unchanged; dimming inert in inventory mode.
