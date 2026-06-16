You are tasked with initialising and maintaining a knowledge vault for <PROJECT_NAME> (<STACK>). The vault lives at <VAULT_PATH>. This prompt defines what the vault is for, how it is structured, and the editorial rules that keep it useful over time.

## 1. What the vault is for
The vault has two layers: the project's **"why" layer**, and a structured **task tracker** (what's left and where it stands). The "why" layer captures:
- Architectural rationale ("why did we split X from Y?")
- Design decisions, in ADR-style decision records
- Domain terminology that has project-specific meaning
- Workflow logic – the *intent* behind multi-step user-facing processes
- Trade-offs, alternatives considered, and constraints that the code cannot express

The task tracker (a dedicated `tasks/` tree — see §7) holds the project's **structured work-in-flight**: goals, bodies of work, and subtasks, each with its status.

The vault is NOT a place for:
- Current code behaviour — what the routes are, what columns a table has, which functions exist. That belongs in <DOCS_PATH> (or in the code itself). The "why" layer decays the moment you duplicate code facts into it.
- **Unstructured** session scratch — throwaway todos jotted mid-thought, ephemeral state. (Structured, durable task tracking *is* welcome; that's exactly what `tasks/` is for. What's excluded is scratch that has no place in a lasting record.)
- Tutorials, runbooks, or onboarding material.
- Anything recoverable from `git log` / `git blame`.

Rule of thumb for the "why" layer: if a future engineer could answer the question by reading the code, do not put the answer in the vault. If they could only answer it by interviewing a previous maintainer, the vault is exactly where it belongs.

## 2. Structural skeleton
The "why" layer is flat within each folder — six folders plus the index. The task tracker is **nested** (it carries structured state, so it has its own shape — see §7):
- <VAULT_PATH>/<INDEX_FILE>            # Map of Content — the canonical entry point
- <VAULT_PATH>/architecture/           # subsystem-level "why" notes
- <VAULT_PATH>/decisions/              # ADR-style decision records, numbered DR-001+
- <VAULT_PATH>/data-models/            # one note per persistent data model
- <VAULT_PATH>/modules/                # one note per significant source file
- <VAULT_PATH>/workflows/              # one note per user-facing process
- <VAULT_PATH>/glossary/               # short definitions of domain-specific terms
- <VAULT_PATH>/tasks/                  # the task tracker (see §7):
    - <VAULT_PATH>/tasks/taskindex.md  #   goals → bodies of work
    - <VAULT_PATH>/tasks/bodies/       #   body-of-work notes
    - <VAULT_PATH>/tasks/subtasks/     #   subtask notes

You may omit "why"-layer folders that genuinely do not apply (a CLI library might have no `workflows/`), but do not invent new top-level folders without revisiting this prompt. Note sprawl is the failure mode to guard against.

## 3. Note taxonomy and naming
| Folder        | Filename convention                 | Length target  |
| ------------- | ----------------------------------- | -------------- |
| architecture/ | kebab-case (`auth-subsystem.md`)    | 100–300 words  |
| decisions/    | `DR-NNN-Title-In-Hyphens.md`        | structured ADR |
| data-models/  | PascalCase matching the class/table | 100–300 words  |
| modules/      | exact filename (`store.js.md`)      | 100–300 words  |
| workflows/    | kebab-case (`form-submission.md`)   | 100–300 words  |
| glossary/     | natural casing of the term          | 3–5 lines      |
| tasks/        | `BOW-NN-*` / `ST-NN.M-*` (see §7)    | see §7         |

Every "why"-layer note opens with a level-1 heading matching the filename's intent. **No YAML frontmatter, no tags, no dates, and no status fields in the "why"-layer notes** — they are intentionally lean; Obsidian's graph view and the index carry the metadata load. (The sole exception is the `tasks/` tracker, whose notes carry a `Status:` field by design — see §7.)

## 4. Decision Record (DR) format
Every DR uses this exact skeleton:

# DR-NNN: Short Title

## Context
[The problem or situation requiring a decision.]

## Decision
[What was chosen — one or two sentences.]

## Rationale
[Why this option won — trade-offs, alternatives considered, constraints, user feedback, prior incidents.]

## Consequences
[What changed downstream, what new constraints this creates, what becomes harder, what becomes easier.]

## Related
- [[architecture-note]]
- [[other-DR]]

DRs are numbered globally and sequentially. To create a new DR, find the highest existing `DR-NNN-*.md` and increment.

## 5. Wikilink conventions
Cross-references use Obsidian wikilinks: `[[Note Title]]`. The link text must match the target filename (minus `.md`). Avoid display-text overrides – readability of the source markdown matters more than prose flow. Every note that introduces or references another vault entity (a model, module, DR, workflow, term, goal, or task) should wikilink it. Two consequences follow:
- New notes must have at least one incoming wikilink from an existing note. Orphans degrade graph navigation and indicate the note doesn't belong.
- The <INDEX_FILE> lists every "why"-layer note exactly once, grouped by category; the task tracker has its own index (`taskindex.md`), which <INDEX_FILE> simply points to.

**Wikilinks resolve by basename, not path** — a `[[Note]]` resolves to a file of that name in any folder. This is load-bearing for the task tracker (notes are organised by type, and their status lives *in* the note, precisely so they never need to move).

## 6. Index file (<INDEX_FILE>) format
The index is plain markdown – no frontmatter. Structure:

# <PROJECT_NAME> – Knowledge Vault
This vault captures the **why** behind <PROJECT_NAME>, plus its task tracker. For technical reference, see <DOCS_PATH>.

## Architecture
- [[note-title]] — one-line hook

## Workflows
- [[note-title]] — one-line hook

## Decision Records
### <Thematic Subgroup>
- [[DR-NNN-Title]]

## Data Models
- [[ModelName]] — one-line hook

## Modules
- [[filename.ext]] — one-line hook

## Glossary
- [[term]] — one-line hook

## Tasks
- [[taskindex]] — the work tracker (goals → bodies of work → subtasks)

Decision Records are grouped by theme for scannability; other categories are flat lists. Every new "why"-layer note must be added to the index in the same change that creates it. The `## Tasks` entry is a single pointer — the goal/BOW structure lives in `taskindex.md`, not here.

## 7. The task tracker (<VAULT_PATH>/tasks/)
The one part of the vault that carries **state**. It is deliberately distinct from the lean, status-free "why" notes above. Organised by **type**, with status carried as **data** (not folder path):
- `tasks/taskindex.md` — goals as headings under `## Active` / `## Completed`. Each goal = `### <Goal Name> (<status>)` + a 1–2 line plain-English blurb + bulleted `[[BOW-…]]` wikilinks to its bodies of work.
- `tasks/bodies/` — `BOW-NN-Title.md`, a significant technical task (a "body of work").
- `tasks/subtasks/` — `ST-NN.M-Title.md`, a specific read/edit/write within a body of work.

**Hierarchy: Goal → Body of Work → Subtask.** Layers are **collapsible — never force all three**: a BOW may have zero subtasks (then it is the atomic unit), a goal may have a single BOW, and the smallest standalone unit is a BOW (never an orphan subtask).

Conventions:
- **Status is a `Status:` field** (`not-started | in-progress | done`) on each BOW/ST note — the source of truth. A goal's status lives in `taskindex.md`, recomputed from its BOWs.
- **Numbering is globally unique** — continue from the highest existing BOW/ST number; never restart per goal (basenames must stay unique so wikilinks resolve).
- **Linking:** forward (index lists a goal's BOWs; a BOW lists its subtasks) + backward (`Goal: [[taskindex#<Goal>]]` on each BOW, `Parent: [[BOW-…]]` on each ST).
- **Subtasks are self-contained** — written so a fresh session can pick one up cold. Split any subtask whose Steps would exceed ~10.

Note shapes:

# BOW-NN: Title
Goal: [[taskindex#<Goal Name>]]
Status: not-started | in-progress | done
## Description   [what this delivers and why]
## Dependencies  [other BOWs that must precede; or "none"]
## Subtasks      [[ST-NN.M-…]] links — or "— none; this BOW is the unit"
## Context       [[DR-…]] / architecture / data-model links

# ST-NN.M: Title
Parent: [[BOW-NN-Title]]
Status: not-started | in-progress | done
## Preconditions [enough to start cold in a fresh session]
## Steps         [ordered, ≤10 — split if more]
## Files         [exact paths + key signatures]
## Acceptance    [how to verify done]
## References    [DRs, sibling/precondition subtasks]

Bloat policy — **manage visibility, not existence:**
- **Never delete** task notes or index entries — they are the durable record of what was built.
- Keep the working view clean by **sectioning** the index (`## Active` vs `## Completed`); surface only `## Active` when asking "what's next."
- If folders ever bloat, completed notes may be relocated into `tasks/bodies/archive/` & `tasks/subtasks/archive/` — link-safe, because wikilinks resolve by basename.

The **vault-scribe** creates and transitions task notes; the **vault-secretary** reads them to surface the list. (The main session never edits `tasks/` directly — except a mechanical `git mv` to relocate notes, which the scribe's toolset cannot perform.)

## 8. Editorial principles
1. **Prefer updating over creating.** Before writing a new note, check if an existing note already covers the topic. The decision tree: extending a DR's rationale/consequences → edit the DR; a subsystem's scope shifted → edit the architecture note; a genuinely new decision → new DR; a new subsystem/module/model/workflow/term → new note.
2. **Capture the why, not the what.** For code facts, the reader can read the code. The vault's job is rationale, trade-offs, and context not recoverable from git.
3. **Be concise.** Architecture/workflow notes target 100–300 words; DRs use the ADR format; glossary entries 3–5 lines. Past ~500 words, ask whether a note should split.
4. **Don't invent rationale.** If the reason for a decision is unknown, say so ("Original rationale unrecorded; current usage suggests X.").
5. **Don't duplicate <DOCS_PATH>.** The vault explains decisions; the docs describe behaviour.
6. **Tasks track progress, not activity.** A task note records a unit of work and its state — not a running session log.

## 9. When you are asked to consult the vault
Always start at <VAULT_PATH>/<INDEX_FILE> (or `taskindex.md` for the task list). Use it to identify the 2–4 relevant notes, then follow wikilinks rather than re-searching. Cite every claim with the note path. If the vault is silent on a question, say so — vault silence is information; inventing context to fill the gap is not.
