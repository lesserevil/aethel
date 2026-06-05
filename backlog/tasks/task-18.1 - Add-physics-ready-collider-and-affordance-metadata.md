---
id: TASK-18.1
title: Add physics-ready collider and affordance metadata
status: In Progress
assignee: []
created_date: 2026-06-05 01:53
updated_date: 2026-06-05 05:20
labels: []
dependencies:
- TASK-16.2
documentation:
- plans/office-physics-simulation-plan.md
modified_files:
- web/src/assets/officeAssetManifest.ts
- web/src/state/sessionTypes.ts
parent_task_id: TASK-18
priority: medium
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Metadata Contract.

WHAT TO DO
Extend the office asset manifest and related environment types with physics-ready metadata: bodyType, colliderType, dimensions, optional massKg, optional friction, optional restitution, semantic label, affordance labels, and whether the object is safe for agent manipulation. Update manifest tests so every interactive office prop has collider/body/affordance metadata. Keep static heavy objects static and mark only small clutter or devices as potentially movable.

WHY
Aethel needs physics metadata before agents can reason about sitting, working surfaces, input devices, containers, or movable props. This metadata also feeds later USD Physics and Newton evaluation work.

HOW TO VERIFY
Run make test. The manifest tests should fail if an interactive asset lacks collider type, body type, dimensions, or affordance metadata. Confirm the baseline session still serializes to JSON and reset behavior still works.

EDGE CASES AND PITFALLS
Do not store runtime physics engine objects in session state. Do not treat high-detail render meshes as collider meshes. Avoid making small metadata additions require Newton, PhysX, Omniverse Kit, or a GPU.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Interactive office assets define body type, collider type, dimensions, semantic labels, and affordances.
- [ ] #2 Manifest/state tests cover the physics metadata without introducing runtime engine dependencies.
<!-- AC:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:20

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
