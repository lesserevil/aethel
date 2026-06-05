---
id: TASK-16.3
title: Implement GLB office asset loader boundary with fallbacks
status: Backlog
assignee: []
created_date: '2026-06-05 01:52'
labels: []
dependencies:
  - TASK-16.2
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - web/src/components/viewport/scene/OfficeAsset.tsx
  - web/src/components/viewport/scene/OfficeAsset.test.tsx
parent_task_id: TASK-16
priority: high
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Web Runtime Integration.

WHAT TO DO
Add a viewport scene component boundary for manifest-backed GLB assets, for example web/src/components/viewport/scene/OfficeAsset.tsx. It should accept a manifest entry or asset id plus transform data, load the local GLB with the project's Three.js/React Three Fiber pattern, and render a deterministic procedural fallback while loading or after a load error. Add tests that mock GLB loading so unit/component tests do not require real WebGL asset parsing.

WHY
Asset loading needs to be isolated from the rest of the viewport so failures do not blank the scene and future USD/web export changes do not leak into state or controls.

HOW TO VERIFY
Run make test and confirm the new component tests cover loading, successful render with mocked GLB content, and failed load fallback behavior. Manually start make run only if needed to confirm no third-party asset URLs are requested at runtime.

EDGE CASES AND PITFALLS
Do not let a missing GLB crash the whole canvas. Do not fetch assets from Poly Pizza, itch.io, or any external host at runtime. Keep fallback dimensions stable so loading states do not change the scene framing unexpectedly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A local GLB loader boundary renders manifest-backed office assets with loading and error fallbacks.
- [ ] #2 Component tests mock asset loading and prove the viewport can survive missing assets.
<!-- AC:END -->
