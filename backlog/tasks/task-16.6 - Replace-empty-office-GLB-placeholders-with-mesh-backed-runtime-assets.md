---
id: TASK-16.6
title: Replace empty office GLB placeholders with mesh-backed runtime assets
status: Done
assignee: []
created_date: '2026-06-05 15:54'
updated_date: '2026-06-05 16:09'
labels: []
dependencies: []
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - Makefile
  - scripts/assets/populate-office-runtime-glbs.mjs
  - docs/asset-pipeline.md
  - docs/office-assets.md
  - docs/office-asset-sources.md
  - plans/office-asset-foundation-plan.md
  - assets/sources/office/manifest.json
  - assets/usd/office/office.usda
  - assets/usd/office/props/book.usda
  - assets/usd/office/props/mug.usda
  - assets/usd/office/props/notebook.usda
  - assets/usd/office/props/office-book-stack.usda
  - assets/usd/office/props/office-coffee-cup.usda
  - assets/usd/office/props/office-laptop.usda
  - assets/usd/office/props/office-notebook.usda
  - assets/exports/web/office/office-book-stack.glb
  - assets/exports/web/office/office-chair.glb
  - assets/exports/web/office/office-coffee-cup.glb
  - assets/exports/web/office/office-desk-lamp.glb
  - assets/exports/web/office/office-desk.glb
  - assets/exports/web/office/office-keyboard.glb
  - assets/exports/web/office/office-laptop.glb
  - assets/exports/web/office/office-monitor.glb
  - assets/exports/web/office/office-notebook.glb
  - assets/exports/web/office/office-trash-can.glb
  - web/public/assets/office/office-book-stack.glb
  - web/public/assets/office/office-chair.glb
  - web/public/assets/office/office-coffee-cup.glb
  - web/public/assets/office/office-desk-lamp.glb
  - web/public/assets/office/office-desk.glb
  - web/public/assets/office/office-keyboard.glb
  - web/public/assets/office/office-laptop.glb
  - web/public/assets/office/office-monitor.glb
  - web/public/assets/office/office-notebook.glb
  - web/public/assets/office/office-trash-can.glb
  - web/src/assets/assetPipeline.test.ts
  - web/src/assets/officeAssetManifest.ts
  - web/src/assets/officeSourceManifest.test.ts
  - web/src/assets/usdOfficeStage.test.ts
  - web/src/physics/placementHelpers.test.ts
parent_task_id: TASK-16
priority: high
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Runtime Asset Layout and § Tests and Verification.

WHAT TO DO
Replace the 48-byte placeholder GLB files under web/public/assets/office/ with real mesh-backed GLB files for the standard office scene. Use direct CC0 Kenney Furniture Kit GLBs where the pack has matching office props: desk, desk chair, laptop, keyboard, monitor/screen, trash can, desk/table lamp, and books/book stack. For any missing small desktop props, create explicit mesh-backed local GLB assets and document their provenance clearly. Add unit coverage that parses each runtime GLB and fails if it has no meshes, no nodes, no buffer payload, or is below a reasonable minimum byte size.

WHY
The current e2e tests only prove that /assets/office/*.glb returns HTTP 200. They do not prove the files contain visible model geometry. The committed files are 48-byte glTF headers with no meshes, so the app cannot render correct office assets even though the network tests pass.

HOW TO VERIFY
Run make test to execute the asset-pipeline/manifest checks. Start the dev server and inspect the standard office viewport; desk, chair, laptop, keyboard, monitor, trash can, lamp, books, coffee cup, and notebook should be visibly distinct objects instead of empty placeholders. Run make fmt-check, make build, and make lint before commit. If Playwright browsers are installed, run make test-e2e or at least the office asset spec.

EDGE CASES AND PITFALLS
Do not commit raw downloaded ZIP archives. Keep runtime files local under web/public/assets/office/. Do not claim an asset comes from Kenney or Eclair unless the actual committed GLB came from that source. Preserve CC0/license metadata for third-party assets and make generated assets obvious in docs/manifests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All ten web/public/assets/office/*.glb files contain mesh-backed model data and are larger than the previous 48-byte placeholders.
- [x] #2 A test fails on empty/no-mesh GLB runtime assets.
- [x] #3 User docs and provenance metadata accurately describe the runtime office assets now committed.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the 48-byte placeholder office GLBs with mesh-backed runtime assets. Eight assets are normalized Kenney Furniture Kit GLBs, and the coffee cup/notebook are deterministic local generated GLBs with explicit CC0 provenance. Added GLB structure tests that parse every runtime asset and fail on no-mesh/no-binary placeholders. Updated docs, source manifest, USD metadata, and Make target support. Verified with make fmt-check, make build, make test, make lint, make assets-validate, make assets-populate-runtime, and make test-e2e.
<!-- SECTION:FINAL_SUMMARY:END -->
