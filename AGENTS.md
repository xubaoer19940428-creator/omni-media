# OmniMedia Codex working rules

## Context and handoffs

- A context-compaction warning is a checkpoint, not a reason to change scope. Keep working on the current user request unless the user replaces it.
- Before compaction or when a task spans multiple turns, update `MEMORY.md`'s `LATEST_MEMORY_START` section with: current status, decisions, files changed, verification results, blockers, and the next concrete action. Keep secrets, credentials, private URLs, and sensitive source data out of the memory.
- After compaction, read only the `LATEST_MEMORY_START` section first, then run `git status --short`. Do not redo work already recorded as complete; inspect the current files and verify only the remaining action.
- If the interface recommends starting a new thread, finish a safe checkpoint and tell the user what to carry forward. A new thread is optional; it does not mean the task failed.

## Change safety

- Preserve unrelated user changes, especially the PikPak migration work.
- Prefer small, reversible edits and run the relevant tests/build after changes.
