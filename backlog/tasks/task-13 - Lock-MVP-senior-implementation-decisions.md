---
id: TASK-13
title: Lock MVP senior implementation decisions
status: Done
assignee: []
created_date: '2026-06-02 23:04'
updated_date: '2026-06-02 23:06'
labels: []
dependencies: []
documentation:
  - docs/language-and-tooling.md
  - plans/aethel_mvp_plan.md
  - README.md
modified_files:
  - docs/language-and-tooling.md
  - plans/aethel_mvp_plan.md
  - README.md
  - LICENSE
  - backlog/tasks/task-3.1 - Scaffold-Vite-React-TypeScript-web-workspace.md
  - >-
    backlog/tasks/task-3.2 -
    Wire-root-Makefile-gates-to-web-app-and-document-commands.md
  - backlog/tasks/task-3.3 - Build-responsive-three-column-Aethel-app-shell.md
  - >-
    backlog/tasks/task-4.2 -
    Implement-session-reducer-actions-selectors-and-mutation-log.md
  - backlog/tasks/task-5 - Implement-center-3D-agent-environment-renderer.md
  - >-
    backlog/tasks/task-5.1 -
    Create-MVP-3D-viewport-boundary-and-baseline-scene.md
  - >-
    backlog/tasks/task-7.1 -
    Implement-chat-adapter-contract-and-deterministic-mock-agent.md
priority: medium
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Detailed Implementation Plan.

WHAT TO DO
Record the senior implementation decisions for the Aethel MVP after product-owner confirmation. The decisions are: Bun as package manager/runtime, React Three Fiber for the browser 3D renderer, plain CSS with CSS variables for styling, React useReducer + context for MVP state management, mock-only in-browser adapters for the MVP backend, procedural primitive assets before GLTF assets, dev as the default branch with feature branches off dev, and MIT licensing. Update docs, plan, README, license, and relevant Backlog task bodies so junior developers do not need to infer these choices.

WHY
The MVP backlog was intentionally written with a few senior decision points open. Those choices are now made and must be reflected in the source-of-truth docs and implementation tasks before the work is handed to junior developers.

HOW TO VERIFY
Read docs/language-and-tooling.md, plans/aethel_mvp_plan.md, README.md, LICENSE, and the affected Backlog tasks. Confirm there are no remaining ambiguous instructions to choose package manager, renderer, styling framework, state manager, backend strategy, asset strategy, branch workflow, or license.

EDGE CASES AND PITFALLS
Do not imply that a Python backend or Omniverse integration exists for the MVP. Do not hand-edit Backlog task files; use Backlog.md task edit commands for task updates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Docs and MVP plan record all confirmed senior decisions.
- [x] #2 MIT license file exists and README references the license.
- [x] #3 Affected Backlog tasks no longer ask junior developers to choose package manager, renderer, styling, state manager, backend strategy, or asset strategy.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Recorded the confirmed senior MVP decisions across README.md, docs/language-and-tooling.md, plans/aethel_mvp_plan.md, and the affected Backlog task bodies. Added the MIT LICENSE file. The locked choices are Bun, React Three Fiber, plain CSS with CSS variables, React useReducer plus context, mock-only in-browser adapters, procedural primitive assets first, dev as default branch with feature branches, and MIT licensing.
<!-- SECTION:FINAL_SUMMARY:END -->
