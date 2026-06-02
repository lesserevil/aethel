---
id: TASK-4.2
title: Implement session reducer actions selectors and mutation log
status: To Do
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-02 23:05'
labels: []
dependencies:
  - TASK-4.1
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-4
priority: high
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Session State Contract and Control Panel Behavior.

WHAT TO DO
Implement the MVP state update layer under web/src/state/ using React useReducer plus context. Add a SessionProvider that owns the reducer and exposes typed dispatch/actions/selectors to the app. Add reducer actions or action creators for applying agent identity changes, agent behavior changes, agent appearance changes, environment preset changes, object enabled toggles, chat message append/update, mutation record append, pending/error metadata, selected object changes, and baseline reset. Add selectors that build chat context and renderer props from session state. Add mutation log helpers that create consistent MutationRecord entries with IDs, timestamps, source, target, summary, status, and typed payload.

WHY
All MVP surfaces depend on consistent state transitions. React useReducer plus context is the confirmed MVP state strategy because it keeps updates explicit and testable without adding Zustand or Redux before the app needs them.

HOW TO VERIFY
Run unit tests covering every action type, reducer immutability, mutation record creation, reset behavior, chat context selectors, and renderer prop selectors. Verify serialized state after representative agent, environment, chat, and reset flows. Add a provider-level test proving components can read state and dispatch through the context.

EDGE CASES AND PITFALLS
Do not erase chat history during baseline reset unless a separate new-session action is added. Do not let selectors mutate arrays or objects. Use deterministic IDs/timestamps in tests by injecting or mocking the generator/clock. Do not introduce Zustand, Redux Toolkit, or another state library in the MVP.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reducer/store handles agent, environment, chat, mutation, UI, and reset actions.
- [ ] #2 Selectors produce chat context and renderer props without mutating state.
- [ ] #3 Unit tests cover representative full state flows and reset behavior.
<!-- AC:END -->
