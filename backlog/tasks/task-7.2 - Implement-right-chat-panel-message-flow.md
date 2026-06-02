---
id: TASK-7.2
title: Implement right chat panel message flow
status: To Do
assignee: []
created_date: '2026-06-02 22:12'
labels: []
dependencies:
  - TASK-7.1
  - TASK-4.2
  - TASK-3.3
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-7
priority: high
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Right Chat Panel and Chat Adapter.

WHAT TO DO
Implement the right ChatPanel component. Render message history, system/context messages, user messages, agent messages, a text input, send button, pending state, and error state. On send, append the user message, call the ChatAdapter with current session context, show pending status, append the agent response, and preserve history on errors. Disable duplicate sends while a request is pending or handle concurrent requests explicitly.

WHY
The right column is the conversation surface with the visible agent. It must use current session context without becoming the direct environment-editing surface.

HOW TO VERIFY
Run component tests. Send a message and verify user message, pending state, adapter request payload, and agent response. Simulate an adapter error and verify the UI shows an error without deleting history. Apply a control-panel mutation from state fixtures and verify the system/context message is displayed.

EDGE CASES AND PITFALLS
Do not let chat directly mutate the environment in the MVP. Do not hard-code mock response text into the component; call the adapter. Ensure long messages wrap and the input does not resize the right column unpredictably.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ChatPanel renders history, input, pending state, response state, and error state.
- [ ] #2 Sending a message calls ChatAdapter with current session context and appends response history.
- [ ] #3 Tests cover adapter error handling and system/context message rendering.
<!-- AC:END -->
