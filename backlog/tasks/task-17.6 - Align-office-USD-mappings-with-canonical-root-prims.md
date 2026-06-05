---
id: TASK-17.6
title: Align office USD mappings with canonical root prims
status: Done
assignee: []
created_date: '2026-06-05 15:42'
updated_date: '2026-06-05 15:42'
labels: []
dependencies: []
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - assets/sources/office/manifest.json
  - assets/usd/office/web-asset-map.json
  - assets/usd/office/props/office-desk.usda
  - assets/usd/office/props/office-chair.usda
  - assets/usd/office/props/office-monitor.usda
  - assets/usd/office/props/office-laptop.usda
  - assets/usd/office/props/office-keyboard.usda
  - assets/usd/office/props/office-trash-can.usda
  - assets/usd/office/props/office-desk-lamp.usda
  - assets/usd/office/props/office-book-stack.usda
  - assets/usd/office/props/office-coffee-cup.usda
  - assets/usd/office/props/office-notebook.usda
  - scripts/assets/validate-usd-stage.py
  - scripts/assets/validate-web-manifest.py
  - web/src/assets/usdOfficeStage.test.ts
  - web/src/assets/webAssetMap.test.ts
parent_task_id: TASK-17
priority: high
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Validation Strategy and § Web Runtime Boundary.

WHAT TO DO
Align the office asset source manifest, web asset map, prop USDA customData, validators, and Vitest drift tests with the current canonical office.usda stage. The current stage defines root prop prims such as /World/Office/OfficeDeskRoot and composes prop files with payloads. Update every mapped usdPrimPath and prop customData value to those root prim paths. Update pure-text validators and tests so they accept both valid USDA forms: untyped prim declarations like def "OfficeDeskRoot" and typed declarations like def Xform "World".

WHY
After the latest pull, make test and make assets-validate fail because stale manifest/test expectations still point at older prim names and assume every prim declaration has a type token. The asset pipeline needs these checks to catch real drift without rejecting the current valid USD stage.

HOW TO VERIFY
Run make test and make assets-validate from the repo root. Also run PATH="$PWD/.venv/bin:$PATH" make assets-validate-test if Python dev dependencies are installed. The web asset map, source manifest, and prop customData should all agree on the same /World/Office/*Root prim paths.

EDGE CASES AND PITFALLS
Do not rename office.usda prims just to satisfy tests. The root stage is the canonical source here. Keep validators strict about the prim leaf name, only broaden the def syntax so untyped and typed prims are both accepted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 make test passes with USD stage, source manifest, and web map drift checks enabled.
- [x] #2 make assets-validate passes mandatory structural, web mapping, and physics metadata checks.
- [x] #3 Prop USDA customData, assets/sources/office/manifest.json, and assets/usd/office/web-asset-map.json agree on the current /World/Office/*Root prim paths.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aligned office source manifest, web asset map, prop USDA customData, validators, and drift tests with the current /World/Office/*Root prim paths. Updated validators/tests to accept typed and untyped USDA def syntax. Verified make test, make assets-validate, and PATH="$PWD/.venv/bin:$PATH" make assets-validate-test.
<!-- SECTION:FINAL_SUMMARY:END -->
