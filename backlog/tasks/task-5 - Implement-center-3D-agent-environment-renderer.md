---
id: TASK-5
title: Implement center 3D agent environment renderer
status: To Do
assignee: []
created_date: '2026-06-02 21:56'
updated_date: '2026-06-02 23:06'
labels: []
dependencies:
  - TASK-4
documentation:
  - plans/aethel_mvp_plan.md
priority: high
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Center 3D View and 3D Renderer Boundary.

WHAT TO DO
Implement the center viewport renderer for the MVP web app using React Three Fiber. Render a nonblank procedural primitive baseline environment and one visible primitive agent avatar on initial load. Bind the renderer to normalized session state so agent appearance changes and environment changes update the visible scene. Include orbit/pan/zoom camera controls, but keep the agent framed by default. Create a renderer component/service boundary that accepts session state and emits only view events such as camera changes or object selection.

WHY
The center 3D view is the main Aethel surface. It proves that the user can see the agent in the current environment and that control-panel mutations are reflected visually. React Three Fiber and primitive assets are the confirmed MVP choices.

HOW TO VERIFY
Run the frontend test suite and a browser visual check. The initial scene must show a visible, framed agent and environment. Change at least one agent appearance setting and one environment setting through state or controls and confirm the rendered scene changes. If Playwright or another browser test runner is configured, include a screenshot or canvas-pixel check that the viewport is nonblank.

EDGE CASES AND PITFALLS
A blank canvas, a camera pointed away from the agent, or an agent hidden by lighting fails the task. Do not bake control-panel state directly into React Three Fiber/Three.js objects without going through the shared session state. The viewport should fill the center work surface and should not resize unpredictably when labels, loading states, or controls change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Initial 3D viewport renders a visible agent and environment.
- [ ] #2 Agent appearance and environment state changes visibly update the renderer.
- [ ] #3 Renderer consumes normalized session state through an isolated boundary.
<!-- AC:END -->
