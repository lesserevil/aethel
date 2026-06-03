---
id: TASK-4
title: Implement MVP session state and mutation model
status: Backlog
assignee: []
created_date: '2026-06-02 21:55'
updated_date: '2026-06-02 23:18'
labels: []
dependencies:
  - TASK-3
documentation:
  - plans/aethel_mvp_plan.md
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § State Model, API Boundary, CRIT-3, CRIT-5, and CRIT-6.

WHAT TO DO
Define the normalized MVP session state used by the web app. Create typed structures for sessionId, agent, environment, chat messages, and applied mutations. Add actions or reducers for changing agent settings, changing environment settings, applying mutations, resetting to the baseline scene, and appending chat/system messages. Keep renderer-specific details out of the state model. If an API layer exists, add typed client functions or mock service functions for GET/PUT session and POST mutations.

WHY
The left controls, center 3D renderer, and right chat panel must not drift. A single state contract lets the MVP browser renderer work now and gives a future Omniverse/Kit renderer a stable input shape.

HOW TO VERIFY
Run unit tests for the state module. Tests should prove that agent changes, environment changes, mutation recording, reset behavior, and chat context updates produce the expected serialized session state.

EDGE CASES AND PITFALLS
Do not store Three.js objects, DOM nodes, or renderer handles in session state. Mutation events should include enough detail for audit/history, but should remain small and serializable. Reset must restore the baseline agent/environment without deleting chat history unless the UI explicitly requests a new session.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typed session state includes agent, environment, chat, and mutations.
- [ ] #2 Control-style updates produce serializable mutation records.
- [ ] #3 Unit tests cover agent changes, environment changes, mutation recording, and reset behavior.
<!-- AC:END -->
