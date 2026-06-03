---
id: TASK-8
title: Add MVP integration and visual verification
status: Backlog
assignee: []
created_date: '2026-06-02 21:56'
updated_date: '2026-06-02 23:18'
labels: []
dependencies:
  - TASK-5
  - TASK-6
  - TASK-7
documentation:
  - plans/aethel_mvp_plan.md
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Acceptance Criteria, especially CRIT-1 through CRIT-7.

WHAT TO DO
Add scripted verification for the complete MVP browser experience after the layout, state model, 3D renderer, control panel, and chat panel exist. Prefer Playwright or the project's selected browser test tool. Cover the desktop three-column layout, initial nonblank 3D viewport, at least three control-panel mutations, chat send/response behavior, mutation entries in chat context, and the renderer boundary consuming normalized session state. Include any required test fixtures or mock adapters.

WHY
The MVP is cross-surface: it only works if controls, renderer, and chat stay synchronized. Unit tests alone will not catch a blank viewport, broken column layout, or missing context handoff.

HOW TO VERIFY
Run the project's frontend test and e2e commands. The e2e run should open the app, assert the left/center/right regions exist, inspect the canvas or screenshot for nonblank rendering, apply agent/environment changes, send a chat message, and verify the resulting UI state.

EDGE CASES AND PITFALLS
Canvas tests can be flaky if they only check for an element. Include a pixel/screenshot or rendered-scene signal so a blank but mounted canvas fails. Keep mock agent responses deterministic. If the tests introduce new build commands or browser dependencies, update user-facing setup documentation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 E2e or integration tests verify desktop three-column layout.
- [ ] #2 Visual verification fails on a blank 3D viewport.
- [ ] #3 Tests cover control mutations, chat adapter behavior, and shared state synchronization.
<!-- AC:END -->
