---
id: TASK-16
title: Build free office asset foundation for the Aethel MVP
status: Backlog
assignee: []
created_date: '2026-06-05 01:51'
labels:
  - epic
dependencies: []
documentation:
  - plans/office-asset-foundation-plan.md
priority: high
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § Purpose and Recommended Free Sources.

WHAT TO DO
Coordinate the first standard office asset rollout for the web MVP. This is an epic-style parent task; implement it through its child tasks. The completed work should source free office assets, prove their licenses and provenance, add a typed manifest under web/src/assets/, place optimized runtime GLB files under web/public/assets/office/, load them through the existing React Three Fiber viewport, and verify the standard office preset through tests.

WHY
Aethel needs a believable office environment for agents to inhabit before deeper USD or physics work is useful. The first asset pass must stay cheap, local, and compatible with the current browser MVP.

HOW TO VERIFY
All child tasks under this parent are Done. Confirm plans/office-asset-foundation-plan.md acceptance criteria CRIT-1 through CRIT-5 are satisfied. Run the project quality gates required by the child tasks, including the existing MVP tests and any new asset manifest or viewport tests.

EDGE CASES AND PITFALLS
Do not introduce paid assets, attribution-required runtime assets, or third-party hosted runtime URLs in the default scene. Do not make OpenUSD, Newton, PhysX, Omniverse Kit, or a GPU required for make run.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All selected office runtime assets are free to use and have source/license provenance in a manifest.
- [ ] #2 The web MVP renders a standard office scene with local GLB assets and deterministic fallbacks.
- [ ] #3 Existing object controls, mutation logging, reset behavior, and chat context continue to work with manifest-backed assets.
<!-- AC:END -->
