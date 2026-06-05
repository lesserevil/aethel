---
id: TASK-18
title: Add office physics metadata and simulation evaluation path
status: Backlog
assignee: []
created_date: '2026-06-05 01:51'
updated_date: '2026-06-05 01:51'
labels:
  - epic
dependencies:
  - TASK-16
documentation:
  - plans/office-physics-simulation-plan.md
priority: medium
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Purpose and Simulation Tiers.

WHAT TO DO
Coordinate the physics-readiness work for the standard office environment. This is an epic-style parent task; implement it through its child tasks. The completed work should add collider/body/affordance metadata, web object selection and simple collider-aware placement, USD Physics metadata for canonical office props, and a Newton evaluation harness with optional dependency handling.

WHY
Aethel eventually needs agents to inhabit and interact with a realistic world. Physics work should start with simple metadata and web interactions, then move toward USD Physics and Newton/PhysX only when the assets are ready to simulate.

HOW TO VERIFY
All child tasks under this parent are Done. Confirm plans/office-physics-simulation-plan.md acceptance criteria CRIT-1 through CRIT-5 are satisfied. Verify the default MVP run path still works without a GPU.

EDGE CASES AND PITFALLS
Do not require Newton, PhysX, Isaac Sim, Omniverse Kit, or server-side GPU hardware for the default browser MVP. Do not use high-detail render meshes as physics meshes unless a task documents and tests an explicit exception.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Office assets have collider/body/affordance metadata suitable for web interactions and USD Physics.
- [ ] #2 The web MVP can select and perform simple collider-aware interactions without GPU physics.
- [ ] #3 Newton is evaluated through an optional smoke harness instead of becoming a default MVP dependency.
<!-- AC:END -->
