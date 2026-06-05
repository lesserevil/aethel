---
id: TASK-18.4
title: Create an optional Newton office-scene smoke harness
status: Done
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 06:34'
labels: []
dependencies:
  - TASK-18.3
documentation:
  - plans/office-physics-simulation-plan.md
modified_files:
  - scripts/physics
  - docs/office-physics.md
parent_task_id: TASK-18
priority: low
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Tier 3: Newton Evaluation.

WHAT TO DO
Create an optional Newton evaluation harness under scripts/physics/ that attempts to load or translate the canonical office USD scene into a small deterministic Newton simulation. The smoke test should exercise at least one static furniture collider and one movable small prop. Add docs/office-physics.md explaining how to install optional Newton dependencies, how to run the smoke harness, what GPU or CPU-only behavior was tested, and why Newton is not required by the default MVP.

WHY
Newton is promising for future contact-rich simulation and robot learning, but Aethel should evaluate it with a small reproducible harness before making it a runtime dependency.

HOW TO VERIFY
Run the harness on a machine with the optional dependencies if available. If Newton or GPU support is unavailable, the script must skip or fail with a clear message instead of breaking default project gates. Run make test if the harness has unit tests or dry-run tests.

EDGE CASES AND PITFALLS
Do not add Newton to the default web dependency set. Do not make make run, make build, or make test require GPU hardware. Keep this task as an evaluation harness, not a production physics runtime migration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An optional Newton smoke harness exists and handles missing Newton/GPU dependencies cleanly.
- [x] #2 Docs state tested CPU/GPU behavior and confirm Newton is not a default MVP dependency.
- [x] #3 If the Newton smoke harness needs GPU-backed execution, docs distinguish optional GPU evaluation from the default GPU-optional MVP path.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING (2026-06-05): Not a duplicate. Only TASK-18.4 covers Newton smoke harness. Will implement: scripts/physics/newton_smoke_harness.py, scripts/physics/test_newton_smoke_harness.py, docs/office-physics.md.

VERIFICATION (2026-06-05): 50/50 physics harness unit and integration tests pass (make physics-harness-test). Dry-run passes with real office USDA files. Newton skip exits 2 with clear message. Existing 39 USD validator tests still pass. make test (web) unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered optional Newton office-scene smoke harness. Not a duplicate — unique task in TASK-18 epic. Created: (1) scripts/physics/newton_smoke_harness.py — parses office USD scene, exercises static desk collider (box 1.4m×0.75m×0.7m) and dynamic coffee-cup prop (cylinder 0.3kg), skips with exit 2 and clear message when Newton/Warp unavailable, dry-run mode uses analytic free-fall without any GPU; (2) scripts/physics/test_newton_smoke_harness.py — 50 unit and integration tests, all passing without Newton or GPU; (3) docs/office-physics.md — Newton install steps, harness usage, tested CPU/GPU behaviour, exit codes, troubleshooting, and why Newton is not an MVP dependency; (4) Makefile — physics-harness-dry-run, physics-harness, and physics-harness-test targets added; default make test unchanged. All 50 harness tests and 39 USD validator tests pass. Newton not added to web dependencies.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 06:27

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
