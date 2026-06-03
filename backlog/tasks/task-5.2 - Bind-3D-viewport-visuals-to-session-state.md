---
id: TASK-5.2
title: Bind 3D viewport visuals to session state
status: Open
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-03 05:17'
labels: []
dependencies:
  - TASK-5.1
  - TASK-4.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-5
priority: high
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § 3D Renderer Boundary and Control Panel Behavior.

WHAT TO DO
Connect the MVP renderer to session state selectors. Agent appearance state should affect visible avatar preset, accent color, name label, and idle pose where implemented. Environment state should affect room/world preset, time of day, lighting, ambience/weather hints, and enabled scene objects. Object selection in the viewport should emit a typed ViewEvent that updates selectedObjectId through the shared state layer.

WHY
The viewport must prove that control-panel changes affect the visible world. This task turns the baseline scene into a state-driven renderer instead of a static demo canvas.

HOW TO VERIFY
Run tests and manually change session state through a test harness or connected controls. Verify one agent appearance change, one environment preset/lighting change, and one object toggle visibly update the viewport. Verify object selection emits a view event without directly mutating state inside the renderer.

EDGE CASES AND PITFALLS
Do not create a parallel renderer-only state model. Avoid expensive full scene rebuilds for every small prop change unless the MVP scene remains simple and tests prove it is stable. Keep default camera framing usable after environment changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Agent appearance changes update visible avatar/name/accent state.
- [ ] #2 Environment and object state changes update visible scene output.
- [ ] #3 Viewport emits selection/camera events without direct shared-state mutation.
<!-- AC:END -->
