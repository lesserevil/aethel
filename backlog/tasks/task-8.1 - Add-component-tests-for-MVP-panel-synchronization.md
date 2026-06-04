---
id: TASK-8.1
title: Add component tests for MVP panel synchronization
status: In Progress
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-04 14:48'
labels: []
dependencies:
  - TASK-6.1
  - TASK-6.2
  - TASK-7.2
  - TASK-5.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-8
priority: medium
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Testing Strategy.

WHAT TO DO
Add focused component/integration tests that render the app shell with shared session state and verify the left controls, center viewport boundary, and right chat panel stay synchronized. Cover applying one agent appearance change, one agent behavior/persona change, and one environment/object change. Assert that shared state updates, MutationRecord entries are appended, ChatPanel displays system/context entries, and ViewportPanel receives updated renderer props.

WHY
The MVP value depends on cross-panel synchronization. Unit tests for individual reducers or controls are not enough if the assembled UI fails to pass state between columns.

HOW TO VERIFY
Run the frontend component/integration test command. The tests should fail if controls update only local draft state, if chat context messages are missing, or if the viewport boundary does not receive updated props.

EDGE CASES AND PITFALLS
Use a renderer stub or spy for these tests rather than depending on WebGL. Full canvas verification belongs in the Playwright visual task. Keep test data deterministic so failures point to state flow, not timing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tests verify agent appearance, behavior/persona, and environment/object changes across panels.
- [ ] #2 Tests assert mutation records and chat system/context entries are produced.
- [ ] #3 Tests assert viewport boundary receives updated session-derived props.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Task requires component/integration tests that render AppShell with a live session reducer and verify cross-panel synchronization for 3 change scenarios: (1) agent appearance, (2) agent behavior/persona, (3) environment/object. Tests must assert shared state updates via reducer, MutationRecord entries appended, ChatPanel displays system messages, and ViewportPanel receives updated renderer props.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 14:46

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
