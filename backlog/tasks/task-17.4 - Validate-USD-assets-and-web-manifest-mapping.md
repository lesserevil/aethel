---
id: TASK-17.4
title: Validate USD assets and web manifest mapping
status: Backlog
assignee: []
created_date: '2026-06-05 01:53'
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
