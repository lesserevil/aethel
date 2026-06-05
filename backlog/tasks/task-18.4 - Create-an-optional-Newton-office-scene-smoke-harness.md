---
id: TASK-18.4
title: Create an optional Newton office-scene smoke harness
status: In Progress
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 06:29'
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
- [ ] #1 An optional Newton smoke harness exists and handles missing Newton/GPU dependencies cleanly.
- [ ] #2 Docs state tested CPU/GPU behavior and confirm Newton is not a default MVP dependency.
- [ ] #3 If the Newton smoke harness needs GPU-backed execution, docs distinguish optional GPU evaluation from the default GPU-optional MVP path.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING (2026-06-05): Not a duplicate. Only TASK-18.4 covers Newton smoke harness. Will implement: scripts/physics/newton_smoke_harness.py, scripts/physics/test_newton_smoke_harness.py, docs/office-physics.md.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 06:27

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
