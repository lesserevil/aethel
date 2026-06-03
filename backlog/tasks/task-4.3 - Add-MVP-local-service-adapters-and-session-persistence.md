---
id: TASK-4.3
title: Add MVP local service adapters and session persistence
status: Open
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-03 05:16'
labels: []
dependencies:
  - TASK-4.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-4
priority: medium
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § API and Persistence Path.

WHAT TO DO
Create local service adapters under web/src/services/. Implement mutationAdapter for validating and normalizing control-panel mutation payloads before they reach the reducer. Implement sessionStorage helpers for saving/loading the current SessionState to browser storage, with versioning or defensive parsing. Define TypeScript interfaces for future REST-backed session and mutation APIs without requiring a backend in this task.

WHY
The MVP can start in-browser, but service boundaries should exist before UI code grows around direct state edits. Persistence also makes manual testing and demos less fragile.

HOW TO VERIFY
Run unit tests for mutation validation and session persistence. Tests should cover valid payloads, invalid payload rejection, missing/corrupt local storage data, and round-tripping a baseline session.

EDGE CASES AND PITFALLS
Do not make UI components import browser storage directly. Do not persist provider credentials or model API details. Defensive parsing should fall back to baseline state rather than crashing the app on old or corrupt saved state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 mutationAdapter validates and normalizes control-panel mutation payloads.
- [ ] #2 sessionStorage helpers load/save serializable SessionState with defensive parsing.
- [ ] #3 Tests cover valid, invalid, missing, and corrupt persistence cases.
<!-- AC:END -->
