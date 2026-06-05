---
id: TASK-17
title: Establish canonical USD scene pipeline for Aethel office assets
status: Backlog
assignee: []
created_date: '2026-06-05 01:51'
updated_date: '2026-06-05 01:51'
labels:
  - epic
dependencies:
  - TASK-16
documentation:
  - plans/usd-scene-pipeline-plan.md
priority: medium
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/usd-scene-pipeline-plan.md § Purpose and Positioning.

WHAT TO DO
Coordinate the USD pipeline work for the standard office environment. This is an epic-style parent task; implement it through its child tasks. The completed work should add an assets/ pipeline layout, source/provenance manifests, canonical OpenUSD office files, non-interactive Make targets for asset build/validation/export, and a mapping between web runtime GLB assets and USD prim paths.

WHY
The browser MVP can use GLB directly, but Aethel's long-term simulation world needs OpenUSD as the authoritative scene representation for composition, validation, references, variants, payloads, and interoperability with Omniverse, Isaac Sim, Newton, and PhysX-style pipelines.

HOW TO VERIFY
All child tasks under this parent are Done. Confirm plans/usd-scene-pipeline-plan.md acceptance criteria CRIT-1 through CRIT-5 are satisfied. Run the asset Make targets added by the child tasks and confirm the web manifest maps back to USD prim paths and source provenance.

EDGE CASES AND PITFALLS
Do not block the current MVP on Omniverse desktop, Nucleus, RTX rendering, or GPU-only tooling. Prefer Blender/OpenUSD CLI tooling first, and add NVIDIA-specific validation only as an optional layer unless a child task explicitly changes that requirement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The repo has a documented assets/ pipeline layout and canonical office USD stage.
- [ ] #2 Asset build, validation, and web export commands run non-interactively through Make targets.
- [ ] #3 Every web office asset can be mapped back to a USD prim path and source manifest entry.
<!-- AC:END -->
