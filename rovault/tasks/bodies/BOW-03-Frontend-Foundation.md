# BOW-03: Frontend Foundation
Goal: [[taskindex#Rovision Demo Development]]
Status: done

## Description
Stand up `app/frontend` — a Vite + React + TypeScript SPA — and the non-visual core it rests on:
design tokens, the hash router, typed API client, a committed fixture bundle (so this BOW can
progress in parallel with [[BOW-02-Backend]]), the three Zustand stores, and the precomputed
data structures (`FrameIndex`, `HeldMaskTimeline`) plus geometry and down-sample utilities. This is
the foundation [[BOW-04-Shell-And-Pre-Playback-Screens]] and [[BOW-05-Playback]] build on.

## Dependencies
- Can start in parallel against the committed fixture bundle (no live backend required).
- For live data it expects [[BOW-02-Backend]] endpoints, but development proceeds against the fixture.

## Subtasks
- [[ST-03.1-Scaffold-Tokens-Router]] — Vite scaffold, design tokens, hash router + dev proxy.
- [[ST-03.2-Types-API-Client-Fixture]] — TS types, API client, committed fixture bundle.
- [[ST-03.3-Stores-And-Derived-Structures]] — Zustand stores, FrameIndex/HeldMaskTimeline, geometry/down-sample utils.

## Context
- [[InferenceOutputs]] — the data the types and stores model.
- [[DR-009-Mask-Hold-Rendering]] — the `HeldMaskTimeline` change-point structure rationale.
