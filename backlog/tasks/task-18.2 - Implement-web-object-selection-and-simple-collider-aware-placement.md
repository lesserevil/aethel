---
id: TASK-18.2
title: Implement web object selection and simple collider-aware placement
status: Backlog
assignee: []
created_date: '2026-06-05 01:53'
labels: []
dependencies:
  - TASK-16.4
  - TASK-18.1
documentation:
  - plans/office-physics-simulation-plan.md
modified_files:
  - web/src/components/viewport/AethelViewport.tsx
  - web/src/components/viewport/scene/SceneObjects.tsx
  - web/src/state/sessionReducer.ts
parent_task_id: TASK-18
priority: medium
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Tier 2: Local Interaction Prototype and Agent Interaction Scope.

WHAT TO DO
Add a lightweight web interaction prototype for office objects. The user should be able to select a manifest-backed object in the viewport, see a stable highlight or selection state, and perform one simple collider-aware operation such as moving/snap-placing a small object onto a valid work surface or preventing an obvious overlap. Record successful interactions through the existing session mutation flow and keep chat context aware of the selected object or moved object.

WHY
Before investing in server-side physics, Aethel needs to prove that asset metadata can drive useful local interactions and agent context in the current MVP UI.

HOW TO VERIFY
Add unit tests for the collider/placement helper logic with known object positions. Add component tests for selection/highlight state. Run make test and make build. If browser e2e coverage is practical, add or update a Playwright test that selects an office object and confirms the UI does not overlap or blank the viewport.

EDGE CASES AND PITFALLS
Do not introduce a heavyweight physics engine for this task. Do not mutate Three.js objects directly without updating session state. Keep object labels and highlights from occluding the viewport or resizing stable UI regions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can select/highlight office objects and perform one simple collider-aware interaction in the web MVP.
- [ ] #2 The interaction records a session mutation and preserves chat/control synchronization.
<!-- AC:END -->
