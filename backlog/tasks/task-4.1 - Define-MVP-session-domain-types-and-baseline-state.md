---
id: TASK-4.1
title: Define MVP session domain types and baseline state
status: To Do
assignee: []
created_date: '2026-06-02 22:11'
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
