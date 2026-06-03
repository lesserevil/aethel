---
id: TASK-3.2
title: Wire root Makefile gates to web app and document commands
status: Open
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-03 05:16'
labels: []
dependencies:
  - TASK-3.1
documentation:
  - plans/aethel_mvp_plan.md
  - README.md
  - docs/language-and-tooling.md
parent_task_id: TASK-3
priority: high
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Delivery Gates and Implementation Sequence.

WHAT TO DO
After web/ exists, replace the root Makefile placeholder quality gates with real commands that delegate to the Bun-managed web app scripts. Update README.md and any relevant docs with the actual Bun install, dev, build, test, lint, fmt, and fmt-check commands. Keep target names compatible with AGENTS.md: fmt, fmt-check, build, test, lint, and clean.

WHY
The repo workflow requires Makefile targets when they exist. The current targets intentionally fail because this repo started from a template. Once the web app exists, project contributors need real quality gates and accurate user-facing docs. Bun is the confirmed package manager and script runner.

HOW TO VERIFY
Run make fmt-check, make build, make test, and make lint from the repo root after running the documented Bun install command. Confirm README.md no longer says those targets are placeholders and instead shows the real Bun-based web app commands.

EDGE CASES AND PITFALLS
Do not remove make init or the Backlog.md setup behavior. If dependency installation is required before the gates pass, document the exact bun install command. Avoid adding commands that open browsers or prompt interactively.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Root Makefile quality gates run real web app commands.
- [ ] #2 README/docs list actual install, dev, build, test, lint, and format commands.
- [ ] #3 make fmt-check, make build, make test, and make lint pass from repo root.
<!-- AC:END -->
