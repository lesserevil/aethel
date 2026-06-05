---
id: TASK-17.3
title: Build the canonical OpenUSD office stage
status: Done
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:46'
labels: []
dependencies:
  - TASK-16.4
  - TASK-17.2
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - assets/usd/office/office.usda
  - assets/usd/office/props
parent_task_id: TASK-17
priority: medium
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § USD Stage Shape.

WHAT TO DO
Create the first canonical OpenUSD office stage under assets/usd/office/. The root office.usda stage must define /World with /World/Office/Architecture, /World/Office/Furniture, /World/Office/Devices, /World/Office/Containers, /World/Office/Clutter, /World/Lights, and /World/Cameras. Add reusable prop USD files under assets/usd/office/props/ for the selected desk, chair, laptop, keyboard, monitor/screen, trash can, and at least three clutter/accessory props. The root stage should reference or payload those props and preserve source/license metadata from assets/sources/office/manifest.json.

WHY
OpenUSD becomes useful when the office scene has a stable hierarchy, reusable prop assets, and metadata that downstream tools can validate and compose.

HOW TO VERIFY
Run make assets-build if this task wires conversion into the build target. Open or parse assets/usd/office/office.usda with the available USD tooling and confirm the hierarchy, default prim, units, up axis, camera, lights, and prop references exist. Add or update validation tests/scripts so the required prim paths are checked automatically.

EDGE CASES AND PITFALLS
Do not flatten everything into one anonymous mesh if separate props are available. Do not lose license/source metadata during conversion. Keep scale in meters and avoid coordinate conventions that conflict with the existing web scene without documenting the conversion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 assets/usd/office/office.usda contains the required /World hierarchy, default prim, units, camera, lights, and referenced office props.
- [x] #2 Each required office prop has a reusable USD representation with source/license metadata.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: No duplicate found after searching OpenUSD/office stage/USD hierarchy/USD props tasks. This is a unique sub-task under TASK-17 epic. Plan: (1) create assets/usd/office/props/ with 10 USDA prop stub files embedding source+license metadata from manifest.json, (2) create assets/usd/office/office.usda with /World hierarchy, default prim, units, up-axis, camera, lights, and prop references, (3) create scripts/assets/validate-usd-stage.py for prim-path structure validation, (4) add vitest tests verifying file existence and stage structure.

IMPLEMENTATION: Created assets/usd/office/office.usda (root stage with /World hierarchy, defaultPrim=World, metersPerUnit=1, upAxis=Y, 3 lights, OfficeCamera, 10 prop references). Created assets/usd/office/props/ with 10 USDA stub files (desk, desk_chair, laptop, keyboard, monitor_wide, trash_can, lamp_desk, mug, book, notebook) each embedding aethel customData dictionary with assetId, sourceId, sourceUrl, licenseId, licenseUrl, originalFormat, usdPrimPath. Created scripts/assets/validate-usd-stage.py (pure-Python structural validator, no usd-core required). Updated scripts/assets/assets-validate.sh to run structural validator first. Added web/src/assets/usdOfficeStage.test.ts with 162 tests. All 825 project tests pass, fmt-check passes, lint passes (0 errors).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered the canonical OpenUSD office stage. Created assets/usd/office/office.usda with defaultPrim=World, metersPerUnit=1, upAxis=Y, /World/Office/{Architecture,Furniture,Devices,Containers,Clutter}, /World/Lights (DomeLight+DistantLight), /World/Cameras (OfficeCamera, 50mm equiv), and prepend references to all 10 prop files. Created 10 prop USDA stubs under assets/usd/office/props/ (desk, desk_chair, laptop, keyboard, monitor_wide, trash_can, lamp_desk from Kenney CC0; mug, book, notebook from Eclair CC0) each with aethel customData preserving assetId/sourceId/sourceUrl/licenseId/licenseUrl/usdPrimPath from manifest.json. Added scripts/assets/validate-usd-stage.py (pure-Python structural validator, no usd-core required) and wired it into assets-validate.sh. Added web/src/assets/usdOfficeStage.test.ts (162 vitest tests). All 825 tests pass, fmt-check and lint clean.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:36

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
