---
id: TASK-16.4
title: Render the standard office preset with local GLB props
status: Backlog
assignee: []
created_date: '2026-06-05 01:52'
labels: []
dependencies:
  - TASK-16.3
documentation:
  - plans/office-asset-foundation-plan.md
modified_files:
  - web/public/assets/office
  - web/src/components/viewport/scene/SceneObjects.tsx
  - web/src/components/viewport/scene/SceneEnvironment.tsx
parent_task_id: TASK-16
priority: high
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/office-asset-foundation-plan.md § MVP Asset Set and Web Runtime Integration.

WHAT TO DO
Add the selected optimized runtime GLB files under web/public/assets/office/ and update the viewport scene object rendering so the standard office preset uses those manifest-backed assets. The rendered preset must include desk, chair, laptop, keyboard, monitor/screen, trash can, and at least three clutter/accessory props. Preserve existing lighting, camera framing, object toggles, reset behavior, and chat/control synchronization.

WHY
This is the point where Aethel stops looking like only a primitive blockout and starts presenting a recognizable office world for agents.

HOW TO VERIFY
Run make test and make build. Add or update viewport tests so the standard office preset tries to render all required manifest asset IDs. Start make run and manually confirm the office scene is nonblank and recognizable. Use browser devtools or Playwright in the follow-up task to confirm no office assets 404.

EDGE CASES AND PITFALLS
Keep committed asset sizes reasonable. If the selected GLB files are too large for normal git history, stop and create a Git LFS/external asset task before adding them. Do not remove procedural fallbacks; tests and failed asset loads still need them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The default office preset renders local GLB props for the required desk, chair, laptop, keyboard, monitor/screen, trash can, and clutter set.
- [ ] #2 Existing controls, reset behavior, mutation logging, and chat context continue to pass their tests.
<!-- AC:END -->
