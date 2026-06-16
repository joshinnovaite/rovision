---
description: Surface the active task list from the vault and choose what to work on
argument-hint: "[optional: a goal name, or a BOW id like BOW-07, to drill into]"
---

Show me the current task roster so I can choose what to work on this session.

Spawn the **vault-secretary** subagent (read-only; scoped strictly to `rovault/tasks/`) to read
the tracker and report — it must not read code, DRs, or any vault folder outside `tasks/`:

- **No argument** → the `## Active` goals and, under each, their bodies of work as
  `BOW-NN — Title — <status>`, flagging any `in-progress` BOWs as natural resume points.
- **A goal name** → that goal's bodies of work (same per-BOW format).
- **A BOW id** (e.g. `BOW-07`) → that body of work plus its subtasks, each
  `ST-NN.M — Title — <status>`.

Then present the secretary's menu and ask which I'd like to lock in — an **entire goal**, a
**specific body of work**, or a single **subtask**. **Stop there**: do not begin planning or
context-gathering (the librarian ∥ Explore fan-out) until I confirm the pick.

Argument (a goal name or BOW id; empty for the full roster): $ARGUMENTS
