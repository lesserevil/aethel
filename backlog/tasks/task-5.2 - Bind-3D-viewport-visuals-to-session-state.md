---
id: TASK-5.2
title: Bind 3D viewport visuals to session state
status: In Progress
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-05 03:15'
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
- [x] #1 Agent appearance changes update visible avatar/name/accent state.
- [x] #2 Environment and object state changes update visible scene output.
- [x] #3 Viewport emits selection/camera events without direct shared-state mutation.
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: AppShell.tsx passes hardcoded baselineSession values to AethelViewport instead of live session state. Fix: (1) AppShell uses useRendererProps()+useSessionDispatch() for live state, (2) SceneEnvironment consumes EnvironmentState for lighting/timeOfDay/preset, (3) AgentAvatar reflects avatarPreset+idlePose, (4) onViewEvent dispatches session/selected_object_change. All with tests.

DISCOVERY: All core bindings implemented. Adding data-preset/data-time-of-day/data-lighting attributes to SceneEnvironment group for verifiable integration tests of environment state flow. Writing AppShell+AethelViewport tests that prove environment preset/lighting changes visible in scene output.

UNDERSTANDING: All core bindings are already in place and all 273 tests pass. Final step: add data-time-of-day and data-lighting attributes to AethelViewport wrapper div plus matching integration tests for environment lighting state flow.

COMPLETION: All 3 acceptance criteria satisfied. (1) Agent appearance: AgentAvatar reads avatarPreset/idlePose/accentColor; viewport exposes data-avatar-preset, data-idle-pose, data-accent-color attributes; name label shows displayName styled with accentColor. (2) Environment: SceneEnvironment.deriveSceneLighting() maps timeOfDay+lighting+preset to light parameters; viewport exposes data-environment-preset, data-time-of-day, data-lighting, data-enabled-objects. (3) No direct state mutation: AppShell.handleViewEvent routes onViewEvent callbacks to dispatch only. All 281 tests pass (make test). Build clean (make build). Lint clean (make lint).
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 14:13

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-04 16:20

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-04 16:20

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-04 16:29

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 5
author: oompah
created: 2026-06-05 03:02

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 6
author: oompah
created: 2026-06-05 03:13

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
