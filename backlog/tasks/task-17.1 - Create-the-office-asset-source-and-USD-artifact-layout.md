---
id: TASK-17.1
title: Create the office asset source and USD artifact layout
status: In Progress
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:24'
labels: []
dependencies:
  - TASK-16.1
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - assets/sources/office/README.md
  - assets/sources/office/manifest.json
parent_task_id: TASK-17
priority: medium
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Repository Layout.

WHAT TO DO
Create the initial assets/ layout for the office pipeline: assets/sources/office/README.md, assets/sources/office/manifest.json, assets/sources/office/licenses/ if license snapshots are needed, assets/usd/office/, and assets/exports/web/office/. Populate the source manifest from docs/office-asset-sources.md so every selected web office asset has a source id, source URL, license id, license URL, original format, intended USD path, and intended web export path. Add .gitkeep files only where empty directories must be tracked.

WHY
The USD pipeline needs a durable asset catalog separate from runtime React state. This layout lets future conversion scripts trace every USD prim and web GLB back to a source record.

HOW TO VERIFY
Run backlog task 16.1 --plain and confirm the selected asset set exists. Inspect assets/sources/office/manifest.json and confirm it covers the same asset ids as docs/office-asset-sources.md. Run any JSON/schema/unit test added by this task, plus make fmt-check if formatting is affected.

EDGE CASES AND PITFALLS
Do not commit large raw asset archives. Do not duplicate conflicting license data between docs and manifest; if both exist, make one clearly derived from the other or add a test that catches drift. Keep paths relative to the repo root.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 assets/sources/office/manifest.json tracks source, license, USD path, and web export path for each selected office asset.
- [ ] #2 The assets/ directory layout exists without committing large raw downloads.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding: Confirmed not a duplicate. Creating assets/ USD pipeline directory structure with source manifest derived from docs/office-asset-sources.md (10 CC0 assets). Adding vitest test for drift detection. Existing officeAssetManifest.ts is the web runtime manifest; this task creates the USD pipeline source catalog.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:20

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
