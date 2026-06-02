---
id: TASK-3.3
title: Build responsive three-column Aethel app shell
status: To Do
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-02 23:05'
labels: []
dependencies:
  - TASK-3.1
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-3
priority: high
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Initial Web App Layout and UI Regions.

WHAT TO DO
Implement the first real Aethel app screen in the web app. Create AppShell with left ControlPanel placeholder, center ViewportPanel placeholder, and right ChatPanel placeholder. Use a desktop grid with stable side columns, roughly 280-340px left and 320-380px right, and a flexible center viewport. Add narrow-screen behavior where the 3D viewport remains primary and controls/chat move into switchable panels, tabs, or drawers. Add accessible region labels and stable test IDs for the three regions. Style the shell with plain CSS and CSS variables only; do not introduce Tailwind, CSS-in-JS, or a component library.

WHY
The three-column layout is the MVP product shape. It establishes the user workflow before detailed controls, renderer, or chat behavior are implemented. Plain CSS keeps the initial UI lightweight and avoids framework churn before the product surface is stable.

HOW TO VERIFY
Run component tests for AppShell. Open the app at desktop width and confirm left controls, center viewport, and right chat are visible simultaneously. Resize to a narrow viewport and confirm panels do not overlap and the center viewport remains usable. Inspect the implementation and confirm styling uses project CSS files and variables, not Tailwind or a component library.

EDGE CASES AND PITFALLS
Do not implement a landing page. Do not put the center viewport inside a decorative card. Do not make the chat panel responsible for environment editing. Keep placeholder text minimal and product-like because this is the actual app surface.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Desktop AppShell renders left, center, and right regions at once.
- [ ] #2 Narrow layout keeps the center viewport primary without overlapping panels.
- [ ] #3 Tests can locate all three regions by stable accessible labels or test IDs.
<!-- AC:END -->
