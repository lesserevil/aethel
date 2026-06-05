---
id: TASK-16.5
title: Verify office asset rendering and document the runtime workflow
status: In Progress
assignee: []
created_date: '2026-06-05 01:52'
updated_date: '2026-06-05 04:59'
labels: []
dependencies:
  - TASK-16.4
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - docs/office-assets.md
  - tests/e2e
parent_task_id: TASK-16
priority: medium
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Tests and Verification.

WHAT TO DO
Add end-to-end or browser-level checks that the standard office preset loads without missing local asset requests and renders a nonblank viewport. Update or create docs/office-assets.md to explain where runtime GLB assets live, where source/provenance is documented, how to add another free office asset, and why the current MVP uses GLB directly instead of requiring USD or Newton.

WHY
Asset failures are easy to miss when a canvas still renders fallback geometry. The repo also needs user-facing documentation for the visible asset workflow once real office props ship.

HOW TO VERIFY
Run make test and make test-e2e if the local browser dependencies are installed. Run make fmt-check and make build. Read docs/office-assets.md and confirm it matches the actual Make commands and file paths. If make test-e2e cannot run because browsers are missing, document that in the task final summary and run the closest available checks.

EDGE CASES AND PITFALLS
Do not add docs for asset Make targets that do not exist yet; those belong to the USD pipeline tasks. Do not make the docs imply USD, Omniverse, Newton, PhysX, or a GPU is required for the default office scene.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Browser/e2e coverage catches missing office asset requests and confirms the standard office viewport is nonblank.
- [ ] #2 User docs describe the current GLB runtime asset workflow accurately.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Task requires (1) adding Playwright e2e tests that verify office assets load without missing HTTP requests and the standard office preset renders nonblank, and (2) creating/updating docs/office-assets.md with user-facing documentation about the GLB runtime asset workflow. Existing code: OfficeAsset.tsx (GLB loader), officeAssetManifest.ts (10 assets), web/public/assets/office/ (10 GLB stubs), viewport.spec.ts (nonblank check exists). Plan: add office-asset-specific e2e spec that intercepts network requests to verify all /assets/office/*.glb loads return 200s (no 404s), plus write docs/office-assets.md matching actual Makefile targets and paths.

DISCOVERY: GLB stubs in web/public/assets/office/ are valid 48-byte minimal glTF binaries (glTF v2, just asset metadata). Vite serves them at /assets/office/FILENAME.glb. The baselineSession has all 10 assets enabled (obj-001..obj-010). The AethelViewport exposes data-environment-preset, data-enabled-objects attributes for test assertions. Plan: (1) write office-assets.spec.ts using Playwright response listener to catch all /assets/office/*.glb requests and assert HTTP 200, plus assert no external asset hosts, plus assert environment-preset=office and all 10 objects enabled; (2) write docs/office-assets.md; (3) update docs/e2e-testing.md table.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 04:57

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
