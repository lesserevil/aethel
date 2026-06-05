---
id: TASK-16.5
title: Verify office asset rendering and document the runtime workflow
status: Backlog
assignee: []
created_date: '2026-06-05 01:52'
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
