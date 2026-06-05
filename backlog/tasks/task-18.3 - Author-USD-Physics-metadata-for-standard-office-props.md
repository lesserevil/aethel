---
id: TASK-18.3
title: Author USD Physics metadata for standard office props
status: Backlog
assignee: []
created_date: '2026-06-05 01:53'
labels: []
dependencies:
  - TASK-17.3
  - TASK-18.1
documentation:
  - plans/office-physics-simulation-plan.md
modified_files:
  - assets/usd/office/office.usda
  - assets/usd/office/props
  - scripts/assets/validate-usd.*
parent_task_id: TASK-18
priority: medium
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Tier 1: USD Physics Metadata.

WHAT TO DO
Add USD Physics-ready metadata to the canonical office USD assets for desk, chair, laptop, keyboard, monitor/screen, trash can, and at least three clutter/accessory props. Mirror the manifest body type, collider type, dimensions, mass, friction, restitution, semantic labels, and affordances where USD schemas or custom metadata are appropriate. Update make assets-validate so it checks that the first standard office props have physics metadata.

WHY
Newton, PhysX, Isaac Sim, and SimReady-style validation need physics information inside the USD representation, not only in browser TypeScript metadata.

HOW TO VERIFY
Run make assets-validate and confirm it fails when a required office prop lacks physics metadata. If USD tooling is installed, parse the stage and inspect the required prims. Run make test if the validation code has unit tests.

EDGE CASES AND PITFALLS
Do not use render meshes as collision meshes by default. Keep heavy furniture static. If an object needs custom metadata because the exact USD schema is not available in local tooling, document the field names and add validation so the metadata remains stable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Required standard office props have USD Physics-ready metadata or documented custom metadata.
- [ ] #2 make assets-validate checks for physics metadata on required office props.
<!-- AC:END -->
