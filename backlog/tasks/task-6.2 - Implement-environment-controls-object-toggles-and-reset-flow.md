---
id: TASK-6.2
title: Implement environment controls object toggles and reset flow
status: Open
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-03 05:17'
labels: []
dependencies:
  - TASK-4.2
  - TASK-3.3
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-6
priority: high
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Control Panel Behavior.

WHAT TO DO
Implement environment-focused controls in the left ControlPanel. Add environment preset select, time-of-day control, lighting preset or intensity control, ambience/weather preset, and a small object list with enabled toggles for the baseline scene objects. Use local draft state and an Apply Environment Changes button that validates the payload, updates shared EnvironmentState, records one MutationRecord, and appends one concise chat system/context message. Add a Reset Scene button that restores baseline agent/environment state, records a reset mutation, clears pending draft/status state, and preserves chat history.

WHY
The MVP needs explicit environment mutation controls separate from chat. This task proves that environment edits update shared state and can later drive the 3D renderer.

HOW TO VERIFY
Run component and state tests. Apply an environment preset change, a time/lighting change, and an object toggle, then verify state, mutation history, and chat context. Trigger reset and verify baseline agent/environment state returns while chat messages remain.

EDGE CASES AND PITFALLS
Do not make reset delete chat history. Do not leave stale draft values or pending mutation status after reset. Avoid environment control labels that wrap awkwardly or resize the left column.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Environment controls cover preset, time/lighting, ambience/weather, and object toggles.
- [ ] #2 Applying environment changes records mutations and chat context messages.
- [ ] #3 Reset restores baseline agent/environment state while preserving chat history.
<!-- AC:END -->
