---
id: TASK-18.12
title: Fix default office static collider overlaps
status: Done
assignee: []
created_date: '2026-06-05 16:32'
updated_date: '2026-06-05 16:37'
labels: []
dependencies: []
documentation:
  - plans/office-static-layout-collision-plan.md
modified_files:
  - web/src/state/baselineSession.ts
  - web/src/assets/officeAssetManifest.ts
  - assets/usd/office/office.usda
  - web/src/physics/placementHelpers.test.ts
  - docs/office-physics.md
  - plans/office-static-layout-collision-plan.md
parent_task_id: TASK-18
priority: high
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-static-layout-collision-plan.md § Scope and § Verification Approach.

WHAT TO DO
Fix the standard office scene's default object transforms so the enabled objects in web/src/state/baselineSession.ts do not overlap under the existing static AABB placement helpers. Add a regression test, preferably in web/src/physics/placementHelpers.test.ts or web/src/state/baselineSession.test.ts, that iterates over every enabled default object and calls validatePlacement(object, object.position, otherEnabledObjects). The test must fail with useful object labels when any default object overlaps another. Update docs/office-physics.md to say the MVP currently has static collider validation only, not dynamic runtime physics.

WHY
The browser MVP does not run a physics engine. Real GLB assets now render, so bad initial transforms show visible interpenetration instead of being hidden by placeholders. The default office should load in a collision-free state even before full physics simulation exists.

HOW TO VERIFY
Run make test and confirm the new default-layout collision regression passes. Run make test-e2e or the viewport/office-asset Playwright specs to confirm the scene still renders all ten objects and remains nonblank. Run make fmt-check, make build, make lint, and make assets-validate before commit.

EDGE CASES AND PITFALLS
Do not add a runtime physics engine in this task. Do not remove any of the ten default office objects. Do not move objects off the desk just to satisfy the test. Use the existing manifest dimensions and placementHelpers.ts contract; if an object rests on the desk, it should have base Y just above the desk top and enough X/Z spacing to avoid other desktop props.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Default enabled office objects pass a validatePlacement-based no-overlap regression test.
- [x] #2 All ten MVP office objects remain enabled and visible in the standard office viewport.
- [x] #3 docs/office-physics.md states the MVP has static collider validation but no dynamic browser physics simulation.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adjusted the default office object transforms so the enabled baseline layout has no AABB overlaps, added a validatePlacement regression that reports conflicting labels, updated the USD/manifest defaults to match, and documented that the current MVP has static collider validation rather than dynamic browser physics. Verified with make fmt-check, make build, make test, make assets-validate, make lint, make test-e2e, and a live Playwright asset-request screenshot check.
<!-- SECTION:FINAL_SUMMARY:END -->
