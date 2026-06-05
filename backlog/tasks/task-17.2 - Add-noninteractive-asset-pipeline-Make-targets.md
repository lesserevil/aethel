---
id: TASK-17.2
title: Add noninteractive asset pipeline Make targets
status: In Progress
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 05:31'
labels: []
dependencies:
  - TASK-17.1
documentation:
  - plans/usd-scene-pipeline-plan.md
modified_files:
  - Makefile
  - scripts/assets
  - docs/asset-pipeline.md
parent_task_id: TASK-17
priority: medium
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Conversion Tooling and Documentation.

WHAT TO DO
Add repo-root Makefile targets for the asset pipeline: assets-build, assets-validate, and assets-export-web. Implement the backing scripts under scripts/assets/ using non-interactive behavior. At this stage the scripts may be minimal, but they must check required tools, print actionable missing-tool messages, and operate on the assets/sources/office and assets/usd/office paths. Create docs/asset-pipeline.md explaining the commands, optional tools such as Blender/OpenUSD Python, and the difference between canonical USD assets and web GLB exports.

WHY
Project rules require Make targets for repeatable workflows. Asset conversion and validation will be fragile if each developer has to remember raw Blender, Python, or validation commands.

HOW TO VERIFY
Run make help and confirm the three new asset targets are listed. Run make assets-validate on the current repo; it should either pass on available placeholder data or fail with a clear non-interactive missing-tool/message that a developer can act on. Run make fmt-check if documentation or scripts are formatted by project tooling.

EDGE CASES AND PITFALLS
Do not add docs for commands before the Make targets exist. Do not open Blender or any editor interactively. Do not make Omniverse desktop, Nucleus, RTX rendering, or GPU hardware mandatory for these targets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make help lists assets-build, assets-validate, and assets-export-web.
- [ ] #2 Asset scripts run non-interactively and report missing optional tools clearly.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Discovery: TASK-17.1 done. assets/sources/office/manifest.json exists with 10 assets. assets/usd/office/ and assets/exports/web/office/ are empty (gitkeep). Makefile uses ## comments for help. Will create 3 scripts + common.sh, update Makefile, create docs/asset-pipeline.md, and a vitest test.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 05:27

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
