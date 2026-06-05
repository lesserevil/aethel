---
id: TASK-18.2
title: Implement web object selection and simple collider-aware placement
status: Done
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:42'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding milestone: Implementing object selection and collider-aware placement for Tier 2. OfficeAsset click handling, AABB placement helpers, object_move reducer, two-step snap interaction, mutation recording, chat context update. Approach: pure AABB math, no physics engine.

Discovery: OfficeAsset had no click/hover handlers - selection only worked for ProceduralObject. AethelViewport used Canvas onClick for background-click which would double-fire (also fires on mesh clicks via DOM). sessionSelectors.selectChatRequestContext did not include selectedObjectId. No placement helpers module existed. sessionReducer had no object_move action.

Implementation: (1) Created web/src/physics/placementHelpers.ts with AABB construction, overlap testing, work-surface/pickup affordance checks, snap position calculation, and validatePlacement/snapToWorkSurface entry points (pure functions, no physics engine). (2) Created 44 unit tests in placementHelpers.test.ts covering known positions. (3) Updated OfficeAsset.tsx to accept isSelected/onViewEvent/objectId props, added SelectionOutline wireframe overlay, added R3F ThreeEvent click/hover handlers with stopPropagation. (4) Updated SceneObjects.tsx to pass all new props to OfficeAsset. (5) Added session/object_move action+reducer (moveObject action creator). (6) Fixed AethelViewport Canvas onClick → onPointerMissed to prevent double-fire on mesh clicks. (7) Extended selectChatRequestContext to include selectedObjectId and resolved selectedObject metadata. (8) Updated AppShell handleViewEvent with two-step snap interaction: if pickup selected + work surface clicked → snapToWorkSurface → moveObject + appendMutation + appendChatMessage. Updated test mocks to support onPointerMissed. Added tests for isSelected forwarding, moveObject reducer, AppShell placement interaction.

Verification: All 629 tests pass (21 test files). Build succeeds (tsc + vite). Lint passes (0 errors). fmt-check passes. New tests added: 44 placement helper unit tests, 5 SceneObjects selection forwarding tests, 4 reducer MOVE_OBJECT tests, 3 AppShell placement interaction tests, 1 E2E viewport stability test. Total: 629 tests up from 582.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented web object selection and collider-aware placement for Tier 2 of the office physics plan. Deliverables: (1) physics/placementHelpers.ts - pure AABB collision helpers (buildAABB, aabbsOverlap, resolveObjectDimensions, isWorkSurface, isPickupObject, validatePlacement, snapToWorkSurface) with 44 unit tests. (2) OfficeAsset.tsx - click/hover event handling with ThreeEvent stopPropagation, SelectionOutline wireframe for selected state. (3) SceneObjects.tsx - forwards isSelected/objectId/onViewEvent to OfficeAsset so all manifested assets support selection. (4) session/object_move reducer action (moveObject) for state-safe position updates. (5) AethelViewport Canvas onClick fixed to onPointerMissed preventing double-fire on mesh clicks. (6) AppShell two-step snap placement: select pickup object, click work surface, AABB placement validated, object moved in state, mutation logged, chat system message appended. (7) selectChatRequestContext extended with selectedObjectId and resolved selectedObject for chat context awareness. All 629 tests pass, build and lint clean.
<!-- SECTION:FINAL_SUMMARY:END -->
