---
id: TASK-9
title: Replace template README with Aethel project README
status: Done
assignee: []
created_date: '2026-06-02 22:01'
updated_date: '2026-06-02 22:02'
labels: []
dependencies: []
documentation:
  - README.md
  - plans/aethel_mvp_plan.md
  - plans/aethel_design.md
modified_files:
  - README.md
priority: medium
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Purpose and Layout; plans/aethel_design.md § Core Concept and Technology Stack.

WHAT TO DO
Replace the bootstrap template README.md with an Aethel-specific README. The README should describe the project, current status, MVP web UI shape, technology direction, repository layout, task-tracking workflow, and current build/test limitations. It must not imply that the app is already implemented or runnable before the web app tasks are complete.

WHY
README.md is the first user-facing project document. The current file describes a generic bootstrap template, which is inaccurate for Aethel and conflicts with the MVP/design plans.

HOW TO VERIFY
Read README.md and confirm it no longer mentions the repo as a bootstrap template. Confirm it references the Aethel MVP plan, the NVIDIA design plan, and the Backlog.md workflow. Confirm it clearly says the Makefile quality gates are not yet configured.

EDGE CASES AND PITFALLS
Do not add install or run commands for an app that does not exist yet. Do not claim production Omniverse/RTX integration is available in the MVP; the current plan starts with a browser-native 3D renderer behind a swappable boundary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README describes Aethel instead of the bootstrap template.
- [x] #2 README accurately states the MVP is planned, not implemented.
- [x] #3 README documents current repo workflow and quality-gate limitations.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the bootstrap template README with an Aethel-specific project overview. The README now documents the planned MVP UI, technology direction, repo layout, Backlog.md workflow, and current quality-gate limitations without claiming the web app is already implemented.
<!-- SECTION:FINAL_SUMMARY:END -->
