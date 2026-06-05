---
id: TASK-16.3
title: Implement GLB office asset loader boundary with fallbacks
status: Done
assignee: []
created_date: '2026-06-05 01:52'
updated_date: '2026-06-05 04:48'
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

Implementation: Created web/src/components/viewport/scene/OfficeAsset.tsx and OfficeAsset.test.tsx. The component exports: deriveFallbackProps() pure function (category-specific muted color + manifest dimensions); AssetErrorBoundary class component (isolates load errors from canvas); GLBContent inner component (calls useGLTF - can suspend); OfficeAsset public boundary component (wraps in Suspense + ErrorBoundary with stable fallback box). Tests cover: loading state via never-resolving Promise mock, success state with mocked scene.clone(), error state via thrown Error caught by ErrorBoundary, URL safety (only /assets/office/ paths, no external hosts). All 32 new tests pass; total 479/479 passing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered web/src/components/viewport/scene/OfficeAsset.tsx (GLB loader boundary component) and OfficeAsset.test.tsx (32 tests). Component uses React Suspense + class-based ErrorBoundary to isolate GLB loading from the canvas - a missing or failed asset renders a deterministic wireframe box fallback (dimensions from manifest entry, stable bounding volume). Exports deriveFallbackProps() pure function. Tests mock @react-three/fiber and @react-three/drei/useGLTF to cover all three states without real WebGL: loading (Suspense fallback visible, no primitive), success (primitive rendered, scene.clone() called, local URL verified), error (ErrorBoundary catches thrown Error, fallback shown). URL safety tests confirm no Poly Pizza/itch.io external hosts. All 479 tests pass (19 test files).
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 04:39

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
