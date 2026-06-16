# DR-012: Task Tracking In Vault

## Context
Task-tracking for rovision had been ad-hoc. Work-in-flight lived in `rovault/todo/` (BOW/ST notes), and before that the habit was a standalone `/tasks` markdown file with `Todo` / `Underway` / `Completed` sections sitting outside the knowledge vault entirely. Neither was wired into the vault's link graph or its index, so "what's left" and "why" were tracked in separate, drifting places. We wanted task tracking folded *into* the vault stack — the same notes, the same `[[wikilink]]` graph, the same `roindex.md` map of content — so the "what's left" layer sits alongside the existing "why" layer and is maintained by the same scribe/librarian machinery.

## Decision
Adopt a `rovault/tasks/` tracker as a first-class part of the vault:
- `taskindex.md` — goals as headings under `## Active` / `## Completed`. Each goal is a `### <Goal Name> (<status>)` with a short plain-English blurb and bulleted `[[BOW-…]]` forward links.
- `bodies/` — `BOW-NN-Title.md`, a significant technical body of work.
- `subtasks/` — `ST-NN.M-Title.md`, a specific read/edit/write within a BOW.

Rules:
- **Status is a `Status:` field** on each BOW/ST note (`not-started | in-progress | done`) — the source of truth — *not* the folder path. A goal's status lives in `taskindex.md`, recomputed from its BOWs (Completed only when all BOWs are `done`).
- **Goals are index headings**, joined to BOWs via forward links (taskindex → BOW, BOW → ST) plus backlinks (`Goal: [[taskindex#<Goal>]]` on each BOW, `Parent: [[BOW-…]]` on each ST).
- **Numbering is globally unique** across all goals (continue from the highest existing BOW/ST number; never restart per goal), so basenames stay unique and wikilinks resolve.
- Hierarchy (Goal → Body of Work → Subtask) is **collapsible**: a BOW may carry zero subtasks (then it is the atomic unit), a goal may carry a single BOW; the smallest standalone unit is a BOW (never an orphan ST).
- A new read-only **vault-secretary** agent surfaces the `## Active` list at session start. The **vault-scribe** owns task creation (manual, or transcribed from an approved plan) and status transitions.
- The `/todo` slash-command was initially left **out of scope**.

## Rationale
- **Status belongs in the note, not the folder.** Obsidian wikilinks resolve by *basename*, so a folder-as-status scheme (`todo/` → `underway/` → `complete/`) would carry **no** link-graph information, yet would force the scribe's single most fragile operation — moving files — on every status change. Putting status in a `Status:` field makes transitions a one-line edit, and lets folders organise by the thing that is stable: *type* (bodies vs subtasks).
- **The engine is an LLM scribe over markdown, not a schema-enforcing database.** Because there is no rigid schema to satisfy, collapsible layers (a BOW with no subtasks, a goal with one BOW) are **free** — flexibility is the default and rigidity is what would actually cost effort. The structure bends to the work rather than the work bending to the structure.
- **Bloat is handled by managing visibility, not existence.** Completed work is never deleted — it is the durable record — it is merely sectioned (`## Active` vs `## Completed`) so the secretary reports only what is live. The basename-resolution property even buys free future archival: completed notes can later move into `bodies/archive/` & `subtasks/archive/` without breaking a single link.

## Consequences
- Supersedes the ad-hoc `rovault/todo/` directory and the older standalone `/tasks` file; the 6 BOWs and 27 STs were relocated (via `git mv`) into `tasks/bodies/` and `tasks/subtasks/`, and their links re-resolve by basename unchanged.
- `CLAUDE.md`'s per-task workflow and guardrails were updated: the **vault-secretary** runs at session start; the **vault-librarian** fans out in parallel with Explore; the **vault-scribe** handles task creation and status transitions. A mechanical `git mv` is the one main-session exception to the never-touch-the-vault-directly rule, since the scribe cannot move files.
- The vault now tracks **"what's left,"** not only **"why"** — both layers share one link graph and one index (`roindex.md`).
- New constraint: globally-unique BOW/ST numbering must be honoured on every create, or basenames collide and wikilinks break.
- **Follow-up:** the `/todo` command — initially out of scope — was subsequently added (`.claude/commands/todo.md`): a read-only trigger that spawns the vault-secretary, takes an optional goal/BOW-id arg to drill down, and always stops for the user to confirm a pick before any planning.

## Related
- [[taskindex]] — the tracker this decision establishes.
- Relates to the existing vault-librarian / vault-scribe workflow (read-only consult vs. write), now extended with the vault-secretary for the active-task surface.
