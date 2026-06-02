---
id: TASK-6.1
title: Implement agent control groups in left panel
status: To Do
assignee: []
created_date: '2026-06-02 22:12'
labels: []
dependencies:
  - TASK-4.2
  - TASK-3.3
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-6
priority: high
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Control Panel Behavior.

WHAT TO DO
Implement the agent-focused controls in the left ControlPanel. Add editable display name, persona preset select, conversational tone select, avatar preset select or segmented control, accent color swatches, idle pose select, and sliders for curiosity, formality, and skepticism. Use local draft state while the user edits. Add an Apply Agent Changes button that validates the draft, dispatches one shared state update, records a MutationRecord, and appends one concise chat system/context message.

WHY
The user needs a predictable non-chat surface for changing the visible agent. These controls also prove that agent state updates flow to the renderer and chat context.

HOW TO VERIFY
Run component and state tests. Edit each agent control, apply changes, and verify the shared AgentState updates. Verify one mutation record and one chat context message are appended per apply action. When TASK-5.2 is complete, verify appearance changes affect the viewport.

EDGE CASES AND PITFALLS
Do not apply every keystroke directly to shared state; use a draft/apply flow. Avoid free-form persona values for the MVP unless validation is defined. Ensure long display names do not break the left panel layout.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Left panel exposes required agent identity, behavior, and appearance controls.
- [ ] #2 Apply Agent Changes validates draft state and records one mutation plus one chat context message.
- [ ] #3 Tests cover draft editing, apply behavior, and layout with long agent names.
<!-- AC:END -->
