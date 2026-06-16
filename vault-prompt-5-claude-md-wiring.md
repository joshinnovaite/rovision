You are wiring vault governance into <PROJECT_NAME>'s session-start instructions. A knowledge vault now exists at <VAULT_PATH>, and **three subagents** (`vault-secretary`, `vault-librarian`, `vault-scribe`) are available. Your job is to make sure every future session knows about the vault and its task tracker, mediates access through the agents, and follows the per-task workflow.

## Step 1 — Locate the session-start instructions file
Look for an existing file, in order: (1) `CLAUDE.md` at the repo root, (2) `.claude/CLAUDE.md`, (3) `AGENTS.md` at the repo root, (4) any markdown file already acting as session-start instructions. If none exists, create `CLAUDE.md` at the repo root. Confirm the chosen file path with the user before editing.

## Step 2 — Insert the vault governance section
Add the section below. If a "Knowledge retrieval" or equivalent section already exists, replace it; otherwise append near the top, after any project overview and before per-feature documentation. Preserve surrounding content.

---8<--- begin insertion ---8<---

## Knowledge retrieval: the vault

The Obsidian-style knowledge vault at <VAULT_PATH> is the canonical store for <PROJECT_NAME>'s **"why" layer** — architectural rationale, design decisions (DRs), domain glossary, workflow logic — **and its task tracker** (what's left and where it stands). Three subagents mediate access:
- **`vault-secretary`** — read-only. Surfaces the **task list** from <VAULT_PATH>/tasks/ (and nothing else) so you can choose what to work on.
- **`vault-librarian`** — read-only. Consults the "why" layer and returns cited summaries (Mode A context, Mode B conflict-check).
- **`vault-scribe`** — writes inside <VAULT_PATH> only: DRs/architecture/etc. **and** the task tracker (creating + transitioning bodies-of-work and subtasks).

Division of labour: **secretary = "what to do"**, **librarian = "why/context"**, **scribe = "record it."** Rely on these agents rather than loading vault content into main context yourself. For "what the code currently does," consult <DOCS_PATH> or the code. The vault covers "why" + "what's left."

The **task tracker** lives at <VAULT_PATH>/tasks/: `taskindex.md` (goals → bodies of work, sectioned `## Active` / `## Completed`), `bodies/` (BOW notes), `subtasks/` (ST notes). Hierarchy is **Goal → Body of Work → Subtask** with collapsible layers; status is a `Status:` field (the source of truth). See the scribe's instructions for the full convention.

## Per-task workflow
For any non-trivial task:
1. **Surface tasks (session start).** Spawn `vault-secretary` to report the active task list. The user picks an **entire goal, a specific body of work, or a single subtask**. (Skip for a quick one-off the user states outright.)
2. **Brief the librarian + scout the code, in parallel.** For the chosen item, spawn `vault-librarian` (Mode A — the DRs/architecture behind it) and an `Explore` agent (the relevant code) concurrently; amalgamate both into your plan.
3. **Plan, implement, verify.** Standard plan-mode → implement → test loop.
4. **Commission the scribe** to (a) record any new/changed design decision, and (b) update the **task tracker** — create task notes (plan-derived or ad-hoc) and/or transition touched BOWs/STs (`Status:` not-started → in-progress → done; recompute goal status). Skip the DR part for pure bug fixes / cosmetic changes; still transition task status if a tracked task advanced.
5. **Conflict-check.** Spawn `vault-librarian` Mode B over the notes the scribe wrote. Resolve `needs-revision` / `conflicts-found` before committing.
6. **Mark complete / commit** only after the above. Vault notes are committed alongside the code change.

## Guardrails
- **Never read <VAULT_PATH> files directly** in the main session — go through `vault-librarian` (the "why" layer) or `vault-secretary` (the task list). Direct reads pollute main context.
- **Never author or edit <VAULT_PATH> content directly** from the main session. Always go through `vault-scribe` — including task-note content and status transitions. Direct writes bypass the conventions and produce orphan/inconsistent notes.
- **Mechanical file moves are the one exception.** The scribe's toolset can't move or delete files, so relocating task notes (e.g. `git mv` into `tasks/`) is a main-session op — but **all content** (authoring, status, links, the index) still goes through the scribe.
- **Skip the scribe's DR duty for trivial work** (bug fixes, cosmetic CSS, dependency bumps) — but still have it transition task status if a tracked task advanced. The vault captures *decisions* and *progress*, not *activity*.
- **Always run the librarian Mode-B conflict check** when the scribe has written anything.

---8<--- end insertion ---8<---

## Step 3 (optional) — Add the `/todo` command
A thin, read-only slash command that surfaces the task list by delegating to the secretary. Skip if the project doesn't use slash commands. Create `.claude/commands/todo.md`:

```markdown
---
description: Surface the active task list from the vault and choose what to work on
argument-hint: "[optional: a goal name, or a BOW id like BOW-07, to drill into]"
---

Show me the current task roster so I can choose what to work on this session.

Spawn the **vault-secretary** subagent (read-only; scoped strictly to <VAULT_PATH>/tasks/) to
read the tracker and report — no argument lists the `## Active` goals + their bodies of work;
a goal name scopes to that goal; a BOW id (e.g. `BOW-07`) lists that BOW plus its subtasks.
It must not read code, DRs, or any vault folder outside `tasks/`.

Present the menu and ask which I'd like to lock in — an entire goal, a specific body of work,
or a single subtask. **Stop there**: do not begin planning or context-gathering until I confirm.

Argument: $ARGUMENTS
```

## Step 4 — Verify
Confirm to the user: which file you edited (full path); whether you appended, replaced a section, or created the file; whether you added the `/todo` command; and that the rest of the file is unchanged. If the file uses non-markdown conventions, adapt the heading levels to match, but do not alter the rules themselves.
