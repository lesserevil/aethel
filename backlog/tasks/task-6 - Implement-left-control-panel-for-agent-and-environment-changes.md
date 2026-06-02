---
id: TASK-6
title: Implement left control panel for agent and environment changes
status: To Do
assignee: []
created_date: '2026-06-02 21:56'
labels: []
dependencies:
  - TASK-4
documentation:
  - plans/aethel_mvp_plan.md
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Left Control Panel, CRIT-3, and CRIT-5.

WHAT TO DO
Implement the left control column for explicit agent and environment changes. Add agent controls for display name, persona preset, avatar style or accent color, conversational tone, and at least two behavior parameters such as curiosity, formality, or skepticism. Add environment controls for environment preset, lighting/time of day, ambience/weather preset, and a small object list or object toggles. Add apply and reset flows that update shared session state, record mutation entries, and add concise system/context messages to chat history.

WHY
The left column is the MVP surface for changing Aethel. It keeps editing separate from chat and gives the user predictable controls for world and agent mutations.

HOW TO VERIFY
Run UI/state tests and manually exercise the controls in the browser. Verify that one agent appearance change, one agent behavior/persona change, and one environment change update session state. When connected to the renderer task, those changes should visibly affect the 3D view. Confirm applied mutations appear in the mutation history and chat context.

EDGE CASES AND PITFALLS
Do not rely on chat prompts as the only way to change the scene. Controls should use appropriate UI widgets: selects for presets, sliders for numeric behavior parameters, toggles for binary environment features, and buttons for apply/reset. Reset should restore the baseline scene predictably and should not leave stale pending mutation state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Control panel exposes required agent controls and environment controls.
- [ ] #2 Applying changes records mutations and adds chat context entries.
- [ ] #3 Reset restores the MVP baseline without stale pending state.
<!-- AC:END -->
