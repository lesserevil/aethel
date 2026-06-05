---
id: TASK-17.5
title: Export canonical USD office assets to web GLB outputs
status: In Progress
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 06:01'
labels: []
dependencies:
  - TASK-17.4
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - scripts/assets/export-web-assets.*
  - assets/exports/web/office
  - web/public/assets/office
parent_task_id: TASK-17
priority: medium
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Web Export Contract.

WHAT TO DO
Implement make assets-export-web so canonical USD office assets can produce or synchronize the optimized GLB files used by the web MVP. The export path should write to assets/exports/web/office/ first, then update web/public/assets/office/ through a deterministic copy/sync step. Update the web asset manifest or mapping file only through checked, deterministic data. Document any required optional tools in docs/asset-pipeline.md.

WHY
Once USD is canonical, the browser assets should be generated or synchronized from USD rather than hand-maintained in a separate universe.

HOW TO VERIFY
Run make assets-export-web, make assets-validate, make build, and make test. Confirm web/public/assets/office/ contains the expected GLB files and that their manifest entries still map to USD prim paths. If the exporter requires Blender or another optional tool that is not installed, the command must fail with a clear message and the task final summary must state what was not run.

EDGE CASES AND PITFALLS
Do not overwrite user-modified runtime assets without a deterministic source path and git diff review. Use non-interactive copy flags. Keep generated file churn minimal and avoid timestamp-only diffs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make assets-export-web produces or synchronizes web GLB files from the canonical USD asset pipeline.
- [ ] #2 After export, make assets-validate confirms web assets still map to USD prim paths and source records.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DISCOVERY: No duplicate found. assets-export-web.sh exists but incomplete - references missing blender_export_glb.py, exports all USD files (not per-prop), missing sync step to web/public/assets/office/. Will create: blender_export_glb.py + build-export-map.py, revise assets-export-web.sh, add tests, update docs.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:54

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
