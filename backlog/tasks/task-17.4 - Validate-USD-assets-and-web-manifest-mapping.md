---
id: TASK-17.4
title: Validate USD assets and web manifest mapping
status: In Progress
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:53'
labels: []
dependencies:
  - TASK-17.3
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - scripts/assets/validate-usd.*
  - web/src/assets/officeAssetManifest.ts
parent_task_id: TASK-17
priority: medium
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Validation and Web Export Contract.

WHAT TO DO
Extend the asset validation script so make assets-validate checks the canonical office USD stage and verifies every web office manifest entry maps to a USD prim path and source manifest record. Use usdchecker/usd-core when available, and make Omniverse Asset Validator or SimReady checks optional. Add a small mapping artifact if needed, for example assets/usd/office/web-asset-map.json, and test it against web/src/assets/officeAssetManifest.ts.

WHY
The project will have two runtime representations for a while: USD for simulation and GLB for the browser. A mapping check prevents the web scene from drifting away from canonical USD and provenance data.

HOW TO VERIFY
Run make assets-validate. It should check parse/schema validity when USD tooling is available and always check JSON/manifest mapping with project-local code. Run make test if the mapping check is covered by TypeScript or script tests.

EDGE CASES AND PITFALLS
Optional NVIDIA validation must skip or report unavailable dependencies cleanly. Do not require Omniverse desktop, Nucleus, RTX rendering, or a GPU for the default validation target. Do not silently ignore a web asset with no USD prim path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make assets-validate verifies the canonical USD stage and web manifest mapping.
- [ ] #2 Optional Omniverse/SimReady validation is clearly optional and skipped cleanly when unavailable.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: No duplicate found. TASK-17.3 (Done) created the USD stage and basic structural validator, but not the web manifest cross-mapping. TASK-17.4 is unique work. Plan: extend assets-validate to optionally use usdchecker/usd-core, cross-check officeAssetManifest.ts entries against USD prim paths and source manifest, add web-asset-map.json, fail on unmapped web assets, skip NVIDIA tooling gracefully.

DISCOVERY: Key files: assets/sources/office/manifest.json (10 source records with usdPrimPath + webExportPath), web/src/assets/officeAssetManifest.ts (10 web entries with url under /assets/office/), assets/usd/office/office.usda (stage with /World/Office/{Furniture,Devices,Containers,Clutter} hierarchy). The web IDs differ from source manifest IDs (e.g. 'office-desk' vs 'desk', 'office-chair' vs 'deskChair'). Need: (1) web-asset-map.json explicitly linking web IDs to source IDs + USD prim paths, (2) validate-web-manifest.py to cross-check all three, (3) extend assets-validate.sh, (4) vitest tests.

IMPLEMENTATION: Created (1) assets/usd/office/web-asset-map.json — maps 10 web IDs to source manifest IDs and USD prim paths. (2) assets/sources/office/web-asset-map.schema.json — JSON schema for the map. (3) scripts/assets/validate-web-manifest.py — mandatory cross-validation: checks every web manifest ID has a map entry, every map entry has a source manifest record, usdPrimPath values are consistent, and stage contains every mapped prim. Optional usdchecker (--usdchecker flag) and Omniverse Asset Validator (--omniverse flag) skip cleanly when unavailable. (4) Updated scripts/assets/assets-validate.sh — added step 2 (web manifest mapping validation) and made USD schema check (step 3) skip gracefully when usd-core not installed. (5) web/src/assets/webAssetMap.test.ts — 70 vitest tests covering map structure, uniqueness, web manifest coverage, source manifest coverage, usdPrimPath consistency, and USD stage coverage. (6) Updated Makefile help text and plans/usd-scene-pipeline-plan.md.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:47

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
