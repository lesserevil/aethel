---
id: TASK-5.1
title: Create MVP 3D viewport boundary and baseline scene
status: To Do
assignee: []
created_date: '2026-06-02 22:11'
labels: []
dependencies:
  - TASK-4.1
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-5
priority: high
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § 3D Renderer Boundary.

WHAT TO DO
Implement the MVP center viewport component under web/src/components/viewport/. Choose Three.js or React Three Fiber for the first renderer and document the choice in a short source comment or local README if helpful. Create AethelViewport with typed props for AgentState, EnvironmentState, selectedObjectId, and onViewEvent. Render a deterministic baseline scene with a floor or terrain, walls or environmental bounds, at least three optional scene objects, lighting, and one visible agent avatar with a readable name label. Add orbit/pan/zoom camera controls and default camera framing on the agent.

WHY
The center 3D view is the main Aethel work surface. This task establishes a visible, nonblank browser renderer while preserving the future option to swap in Omniverse/Kit streaming.

HOW TO VERIFY
Run component tests where possible and manually open the app. The viewport must show an environment and agent on first load. If a renderer-ready callback or test signal is needed for later e2e checks, add it now.

EDGE CASES AND PITFALLS
A mounted but blank canvas is not acceptable. Do not store Three.js objects in shared session state. Avoid decorative cards around the viewport; it should fill the center work surface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AethelViewport accepts typed session-derived props and emits typed view events.
- [ ] #2 Initial scene renders visible environment geometry, at least three objects, and one framed agent.
- [ ] #3 Viewport exposes a deterministic ready signal or test hook for later visual verification.
<!-- AC:END -->
