---
id: TASK-7.1
title: Implement chat adapter contract and deterministic mock agent
status: To Do
assignee: []
created_date: '2026-06-02 22:12'
labels: []
dependencies:
  - TASK-4.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-7
priority: high
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Chat Adapter.

WHAT TO DO
Create chat adapter types and a deterministic mock implementation under web/src/services/. Define ChatRequest, ChatResponse, ChatAdapter, and any error types. ChatRequest must include sessionId, user message, current AgentState, current EnvironmentState, and recent chat messages. mockChatAdapter should return a believable agent response that references the current agent name/persona or environment preset so tests can prove context was passed. Support AbortSignal or an equivalent cancellation path.

WHY
The MVP chat UI should not hard-code a model provider. A stable adapter lets the UI work with a mock now and a future POST /api/chat or NVIDIA-backed service later.

HOW TO VERIFY
Run unit tests for the adapter. Verify request context is required, mock responses are deterministic, cancellation/error paths are testable, and the adapter does not mutate session state.

EDGE CASES AND PITFALLS
Do not import NVIDIA, OpenAI, or other model SDKs in this task. Do not let the mock adapter perform scene mutations. Keep response timing deterministic in tests by controlling delays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Chat adapter types include current agent, environment, and recent message context.
- [ ] #2 Mock adapter returns deterministic context-aware responses.
- [ ] #3 Tests cover normal response, error/cancel behavior, and no state mutation.
<!-- AC:END -->
