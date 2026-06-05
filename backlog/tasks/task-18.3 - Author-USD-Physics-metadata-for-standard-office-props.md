---
id: TASK-18.3
title: Author USD Physics metadata for standard office props
status: Done
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 06:27'
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
- [x] #1 Required standard office props have USD Physics-ready metadata or documented custom metadata.
- [x] #2 make assets-validate checks for physics metadata on required office props.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Confirmed NOT a duplicate. TASK-18.1 (Done) added physics metadata to TypeScript officeAssetManifest.ts (browser layer). TASK-18.3 covers the USD file layer (assets/usd/office/*.usda) needed by Newton, PhysX, Isaac Sim. Different scopes - TASK-18.3 mirrors TASK-18.1 values into USD representations. Proceeding with implementation.

DISCOVERY: No USD assets directory exists yet (assets/usd/office/ is absent). TypeScript manifest in web/src/assets/officeAssetManifest.ts already has all 10 props with body type, collider type, dimensions, mass, friction, restitution, semantic labels, and affordances from TASK-18.1. Plan: (1) create assets/usd/office/props/*.usda with customData physics metadata + USD Physics API schema annotations; (2) create assets/usd/office/office.usda main scene; (3) create scripts/assets/validate-usd.py + test_validate_usd.py; (4) add assets-validate Makefile target. No USD tooling installed so validator parses USDA text via Python regex.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered USD Physics metadata for all 10 required standard office props (desk, chair, monitor, laptop, keyboard, trash-can, desk-lamp, book-stack, coffee-cup, notebook). Each USDA file in assets/usd/office/props/ carries: standard USD Physics API schemas (PhysicsCollisionAPI on all; PhysicsRigidBodyAPI on dynamic props); customData with physicsBodyType, physicsColliderType, physicsDimensions, semanticLabel, assetId, category, agentSafe, affordances; and physicsMassKg/friction/restitution for dynamic props. Values mirror TASK-18.1 TypeScript manifest exactly. Explicit simple collision child prims (Cube/Cylinder/Mesh) are kept separate from the render mesh GLBs. assets/usd/office/office.usda composes all props via payload references. scripts/assets/validate_usd.py validates all 10 prop files by parsing USDA text (no pxr required); make assets-validate passes (10/10) and exits 1 when a required prop is absent. 39 pytest tests in scripts/assets/test_validate_usd.py cover parser, per-prop validation, and main() exit codes. 629 existing web tests unaffected. Not a duplicate: TASK-18.1 covered TypeScript/browser metadata; this task covers the USD representation layer.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 06:16

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
