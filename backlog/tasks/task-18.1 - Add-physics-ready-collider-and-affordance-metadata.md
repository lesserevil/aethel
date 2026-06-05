---
id: TASK-18.1
title: Add physics-ready collider and affordance metadata
status: Done
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:26'
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
- [x] #1 Interactive office assets define body type, collider type, dimensions, semantic labels, and affordances.
- [x] #2 Manifest/state tests cover the physics metadata without introducing runtime engine dependencies.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added physics-ready metadata to all 10 office asset manifest entries. New types: BodyType ('static'|'kinematic'|'dynamic'), ColliderType (adds 'trimesh' to ColliderHint, backward-compatible alias preserved), Affordance extended with 'pickup'/'displayable'/'containable'. OfficeAssetEntry gains bodyType, colliderType, semanticLabel, agentSafe (required), massKg/friction/restitution (optional). Heavy furniture (desk, chair, lamp, monitor) is static/agentSafe=false; small devices and clutter (laptop, keyboard, trash can, books, cup, notebook) are dynamic/agentSafe=true with mass and friction values. 57 new physics-metadata tests added; all 573 tests pass, typecheck and lint clean. No runtime physics engine dependencies introduced.
<!-- SECTION:FINAL_SUMMARY:END -->
