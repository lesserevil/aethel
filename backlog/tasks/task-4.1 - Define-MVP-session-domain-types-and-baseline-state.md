---
id: TASK-4.1
title: Define MVP session domain types and baseline state
status: Done
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-03 07:36'
labels: []
dependencies:
  - TASK-3.1
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-4
priority: high
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Session State Contract.

WHAT TO DO
Create the TypeScript domain model for MVP session state under web/src/state/. Define types for SessionState, AgentState, EnvironmentState, SceneObjectState, ChatState, ChatMessage, MutationRecord, and UiState. Add a baselineSession fixture that includes one default agent, one default environment preset, at least three scene objects, empty or seeded chat history, and no applied mutations. Ensure every state object is serializable JSON.

WHY
The MVP needs one shared state contract so the left controls, center renderer, and right chat panel stay synchronized and future backend/renderer integrations have a stable payload shape.

HOW TO VERIFY
Run TypeScript typecheck and unit tests. Add tests that assert the baseline session has a sessionId, visible agent defaults, environment defaults, three objects with stable IDs, and no renderer-specific objects.

EDGE CASES AND PITFALLS
Do not include DOM nodes, Three.js objects, functions, model clients, or class instances in shared state. Keep enum/string literal values explicit enough that controls and tests can use them without guessing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Session domain types cover agent, environment, chat, mutations, and UI state.
- [ ] #2 baselineSession is serializable and includes one agent plus at least three scene objects.
- [ ] #3 Unit tests verify baseline state shape and absence of renderer-specific values.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding the requirements: I need to create TypeScript domain models for MVP session state under web/src/state/. This includes defining types for SessionState, AgentState, EnvironmentState, SceneObjectState, ChatState, ChatMessage, MutationRecord, and UiState, plus a baselineSession fixture.

Discovery: Found the project structure and confirmed TypeScript setup. Created the session types and baseline session files.

Implementation: Created sessionTypes.ts with all required domain types (SessionState, AgentState, EnvironmentState, SceneObjectState, ChatState, ChatMessage, MutationRecord, UiState) and baselineSession.ts with the baseline fixture containing one default agent, one default environment preset, three scene objects, empty chat history, and no applied mutations.

Verification: All tests pass (8/8), TypeScript compilation succeeds with no errors, and linting passes with only minor warnings. The baseline session contains sessionId, visible agent defaults, environment defaults, three objects with stable IDs, and no renderer-specific objects as required.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Defined MVP session domain types and baseline state as required. Created sessionTypes.ts with all required domain types (SessionState, AgentState, EnvironmentState, SceneObjectState, ChatState, ChatMessage, MutationRecord, UiState) and baselineSession.ts with a baseline fixture containing one default agent, one default environment preset, three scene objects, empty chat history, and no applied mutations. All state objects are serializable JSON and pass validation tests.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-03 06:09

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-03 06:09

Focus: Feature Developer
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-03 06:10

Run #1 [attempt=1, profile=default, role=fast -> Godspeed/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4]
- Turns: 0, Tool calls: 0
- Tokens: 0 in / 0 out [0 total]
- Cost: $0.0000
- Exit: terminated, Duration: 1m 8s
- Log: TASK-4.1__20260603T060953Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-03 06:17

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
