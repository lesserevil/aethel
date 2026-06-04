---
id: TASK-8.2
title: Add Playwright e2e layout chat and nonblank viewport checks
status: In Progress
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-04 15:14'
labels: []
dependencies:
  - TASK-8.1
  - TASK-3.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-8
priority: medium
ordinal: 25000
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
<!-- COMMENTS:END -->
