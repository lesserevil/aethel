---
id: TASK-16.3
title: Implement GLB office asset loader boundary with fallbacks
status: In Progress
assignee: []
created_date: '2026-06-05 01:52'
updated_date: '2026-06-05 04:43'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding: Implementing OfficeAsset.tsx - a React Three Fiber scene boundary component that loads GLB files from the manifest (local /assets/office/ URLs only) via useGLTF with Suspense + ErrorBoundary, renders a deterministic procedural fallback box while loading or on error. Tests mock useGLTF so no real WebGL/GLB parsing needed. Following existing patterns: pure functions extracted and tested independently (deriveFallbackProps), component tests mock @react-three/drei and @react-three/fiber. Will cover 3 states: loading (Suspense fallback), success (primitive rendered), error (ErrorBoundary fallback).
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 04:39

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
