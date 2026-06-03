---
id: TASK-7
title: Implement right agent chat panel and chat adapter
status: Backlog
assignee: []
created_date: '2026-06-02 21:56'
updated_date: '2026-06-02 23:18'
labels: []
dependencies:
  - TASK-4
documentation:
  - plans/aethel_mvp_plan.md
priority: high
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Right Chat Panel, API Boundary, and CRIT-4.

WHAT TO DO
Implement the right chat column for conversation with the visible agent. Add message history, a text input, send behavior, pending state, error state, and response rendering. Create a chat adapter boundary that accepts the user message plus current agent and environment context from session state. The first adapter may be a mock response service, but the interface should also support a future real model endpoint such as POST /api/chat. Add system/context messages from applied control-panel changes to the same chat history when the state module exposes them.

WHY
The right column is the user conversation surface. It needs to feel connected to the visible agent and current environment without becoming the primary editing tool.

HOW TO VERIFY
Run chat component and adapter tests. Verify that sending a message appends the user message, shows a pending state, and appends an agent response. Verify that the adapter receives current agent name/persona and environment preset/time/ambience in its request context. Force an adapter error and confirm the UI shows an error without losing message history.

EDGE CASES AND PITFALLS
Do not let chat directly mutate the scene in the MVP unless a separate explicit confirmation flow exists. Do not hard-code a single model provider into UI components. The chat panel should remain usable if the 3D renderer is busy or fails.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Chat panel supports message history, input, pending state, agent response, and error state.
- [ ] #2 Chat adapter receives current agent and environment context.
- [ ] #3 Chat UI does not directly perform unconfirmed environment mutations.
<!-- AC:END -->
