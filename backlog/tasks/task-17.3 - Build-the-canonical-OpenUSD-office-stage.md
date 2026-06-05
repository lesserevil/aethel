---
id: TASK-17.3
title: Build the canonical OpenUSD office stage
status: Backlog
assignee: []
created_date: '2026-06-05 01:53'
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
- [ ] #1 assets/usd/office/office.usda contains the required /World hierarchy, default prim, units, camera, lights, and referenced office props.
- [ ] #2 Each required office prop has a reusable USD representation with source/license metadata.
<!-- AC:END -->
