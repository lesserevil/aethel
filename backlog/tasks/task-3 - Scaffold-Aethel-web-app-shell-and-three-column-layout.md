---
id: TASK-3
title: Scaffold Aethel web app shell and three-column layout
status: Backlog
assignee: []
created_date: '2026-06-02 21:55'
updated_date: '2026-06-02 23:18'
labels: []
dependencies: []
documentation:
  - plans/aethel_mvp_plan.md
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Layout and CRIT-1.

WHAT TO DO
Create the initial browser web app for the Aethel MVP. Put the app under a new web/ directory unless a project-specific web app directory already exists. Use a modern TypeScript frontend stack suitable for a 3D canvas, such as Vite + React + TypeScript. Build the first screen as a three-column application shell: left control column, center 3D viewport region, and right chat column. Add stable desktop column widths for the left and right panels and let the center viewport fill remaining space. Add a narrow-screen behavior where controls and chat collapse into switchable panels or drawers while the 3D view remains primary.

WHY
The MVP experience starts with the actual Aethel operator interface, not a landing page. The three-column layout is the core product shape the user requested.

HOW TO VERIFY
Run the frontend dev/build/test commands configured for the new web app. Open the app in a browser and confirm that a desktop viewport shows all three regions at once with the 3D viewport in the center. Resize to a narrow viewport and confirm controls/chat do not overlap the 3D view.

EDGE CASES AND PITFALLS
Do not put the 3D viewport inside a decorative card. It should be the central work surface. Do not make the right column edit the environment; it is chat-only. If root Makefile quality gates are updated to call web commands, update user-facing setup/build documentation in the same change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Desktop layout shows left controls, center 3D viewport region, and right chat at once.
- [ ] #2 Narrow layout keeps the 3D view primary and prevents panel overlap.
- [ ] #3 Frontend build/test commands for the scaffolded app pass.
<!-- AC:END -->
