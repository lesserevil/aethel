---
id: TASK-18.5
title: Verify the default MVP remains GPU-optional
status: Backlog
assignee: []
created_date: '2026-06-05 01:53'
updated_date: '2026-06-05 02:04'
labels: []
dependencies:
  - TASK-18.2
  - TASK-18.4
documentation:
  - plans/office-physics-simulation-plan.md
modified_files:
  - docs/office-physics.md
  - README.md
parent_task_id: TASK-18
priority: medium
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-physics-simulation-plan.md § Testing and Verification.

WHAT TO DO
Verify and document that the default browser MVP still runs without server-side GPU physics after collider metadata, web interactions, USD Physics metadata, and Newton evaluation work land. Update README.md and docs/office-physics.md only where the actual shipped commands or requirements changed. The docs should distinguish default GLB/web behavior from optional USD validation, optional Newton evaluation, and any GPU-backed future path.

WHY
The project should be honest about runtime requirements. Users should not think they need a GPU just to run the MVP office scene, while future simulation work should still have a documented optional path.

HOW TO VERIFY
Run make fmt-check, make build, make test, and make lint. Start make run and confirm the MVP starts on the current machine without requiring Newton, PhysX, Omniverse Kit, or a GPU. If e2e browsers are installed, run make test-e2e. Confirm docs match the observed behavior and do not advertise unavailable commands.

EDGE CASES AND PITFALLS
Do not overpromise CPU-only Newton performance if the smoke harness was not tested that way. Do not remove optional GPU notes for future simulation, but keep them clearly separate from default MVP requirements.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Default MVP setup/run docs state that GPU physics is not required for make run.
- [ ] #2 Quality gates and a make run smoke check pass without Newton, PhysX, Omniverse Kit, or GPU requirements.
- [ ] #3 If any future task makes a GPU mandatory for client-side or server-side workflows, README/docs explicitly state the affected side, required workflow, fallback status, and tested hardware requirement.
<!-- AC:END -->
