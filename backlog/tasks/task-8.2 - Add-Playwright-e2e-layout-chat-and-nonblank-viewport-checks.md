---
id: TASK-8.2
title: Add Playwright e2e layout chat and nonblank viewport checks
status: In Progress
assignee: []
created_date: 2026-06-02 22:12
updated_date: 2026-06-05 02:48
labels:
- merge-conflict
dependencies:
- TASK-8.1
- TASK-3.2
documentation:
- plans/aethel_mvp_plan.md
parent_task_id: TASK-8
ordinal: 25000
oompah.task_costs:
  total_input_tokens: 46
  total_output_tokens: 6024
  total_cost_usd: 0.0
  by_model:
    unknown:
      input_tokens: 46
      output_tokens: 6024
      cost_usd: 0.0
  runs:
  - profile: default
    model: unknown
    input_tokens: 46
    output_tokens: 6024
    cost_usd: 0.0
    recorded_at: '2026-06-05T02:47:11.725710+00:00'
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Testing Strategy and Delivery Gates.

WHAT TO DO
Add Playwright or the selected browser test runner for end-to-end MVP verification. Tests must open the built or dev-served app, verify the desktop three-column layout, verify narrow-screen behavior does not overlap panels, confirm the 3D viewport is nonblank through a canvas pixel sample, screenshot comparison, or renderer-ready visual signal, apply representative agent/environment changes, send a chat message, and verify the agent response uses current context.

WHY
The MVP can appear to pass unit tests while still failing in the browser because of layout, canvas, or async chat issues. End-to-end tests are the acceptance gate for the actual user experience.

HOW TO VERIFY
Run the documented e2e command from the repo root or web/. Confirm the test fails if the canvas is blank, if the three regions are missing, if control mutations do not update UI state, or if chat responses ignore current session context.

EDGE CASES AND PITFALLS
Do not only assert that a canvas element exists. Avoid flaky sleeps; wait for explicit app and renderer readiness. Keep mock agent responses deterministic. If browser binaries must be installed, document the command and make it non-interactive.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E2e tests verify desktop and narrow responsive layouts.
- [ ] #2 E2e visual check fails on a blank 3D viewport.
- [ ] #3 E2e flow covers control mutation, chat send/response, and current context usage.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Task requires adding Playwright e2e tests. Web app already has playwright.config.ts configured with Chromium. Need to create web/tests/e2e/ directory with tests for: 3-column desktop layout, narrow viewport no-overlap, nonblank canvas pixel check, control mutation flow, chat with context. Will also add e2e script to package.json and Makefile.

UNDERSTANDING: The e2e test infrastructure is already committed (commit a37d68c). Files include: web/tests/e2e/layout.spec.ts, viewport.spec.ts, chat.spec.ts, controls.spec.ts, plus playwright.config.ts, docs/e2e-testing.md, and Makefile test-e2e target. Verifying tests work and closing task.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 15:08

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-04 15:08

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-04 15:12

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-04 17:23

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 5
author: oompah
created: 2026-06-04 17:23

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 6
author: oompah
created: 2026-06-04 17:36

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 7
author: oompah
created: 2026-06-04 17:36

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 8
author: oompah
created: 2026-06-04 17:37

Agent failed: Exception: Control request timeout: initialize. Retrying in 10s (attempt #1)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 9
author: oompah
created: 2026-06-04 17:37

Run #1 [attempt=1, profile=default, role=fast -> Claude/default]
- Turns: 0, Tool calls: 0
- Tokens: 0 in / 0 out [0 total]
- Cost: $0.0000
- Exit: error, Duration: 1m 13s
- Log: TASK-8.2__20260604T173640Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 10
author: oompah
created: 2026-06-04 17:38

Agent dispatched (profile: standard)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 11
author: oompah
created: 2026-06-04 17:38

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 12
author: oompah
created: 2026-06-04 17:43

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 13
author: oompah
created: 2026-06-05 02:36

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 14
author: oompah
created: 2026-06-05 02:36

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 15
author: oompah
created: 2026-06-05 02:42

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 16
author: oompah
created: 2026-06-05 02:43

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 17
author: oompah
created: 2026-06-05 02:47

Agent completed successfully in 254s (6070 tokens)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 18
author: oompah
created: 2026-06-05 02:47

Run #1 [attempt=1, profile=default, role=fast -> Claude/default]
- Turns: 76, Tool calls: 55
- Tokens: 46 in / 6.0K out [6.1K total]
- Cost: $0.0000
- Exit: normal, Duration: 4m 14s
- Log: TASK-8.2__20260605T024303Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 19
author: oompah
created: 2026-06-05 02:47

YOLO: Merge conflict detected on MR #36. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 20
author: oompah
created: 2026-06-05 02:48

YOLO: Merge conflict detected on MR #36. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 21
author: oompah
created: 2026-06-05 02:48

Agent dispatched (profile: standard)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
