---
id: TASK-7.1
title: Implement chat adapter contract and deterministic mock agent
status: Done
assignee: []
created_date: '2026-06-02 22:12'
updated_date: '2026-06-04 16:34'
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
Create chat adapter types and a deterministic in-browser mock implementation under web/src/services/. Define ChatRequest, ChatResponse, ChatAdapter, and any error types. ChatRequest must include sessionId, user message, current AgentState, current EnvironmentState, and recent chat messages. mockChatAdapter should return a believable agent response that references the current agent name/persona or environment preset so tests can prove context was passed. Support AbortSignal or an equivalent cancellation path. Do not add a Python/FastAPI backend in the MVP.

WHY
The MVP chat UI should not hard-code a model provider. A stable mock-only adapter lets the UI work now and leaves room for a future POST /api/chat or NVIDIA-backed service later, without forcing backend setup into the first release.

HOW TO VERIFY
Run unit tests for the adapter. Verify request context is required, mock responses are deterministic, cancellation/error paths are testable, and the adapter does not mutate session state. Confirm the implementation runs fully in-browser and does not require a backend process.

EDGE CASES AND PITFALLS
Do not import NVIDIA, OpenAI, FastAPI, or other model/backend SDKs in this task. Do not let the mock adapter perform scene mutations. Keep response timing deterministic in tests by controlling delays.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Chat adapter types include current agent, environment, and recent message context.
- [x] #2 Mock adapter returns deterministic context-aware responses.
- [x] #3 Tests cover normal response, error/cancel behavior, and no state mutation.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: executed `make test`; all 6 tests pass, confirming required context validation, deterministic responses, abort handling, and no state mutation.

Verification: All 6 chat adapter tests pass (33 total). Implementation verified correct: required field validation, deterministic context-aware responses referencing agent displayName/personaPreset and environment preset, AbortSignal cancellation, no state mutation. Branch pushed to origin/TASK-7.1.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented ChatRequest, ChatResponse, ChatAdapter types and mockChatAdapter in web/src/services/chatAdapter.ts. The mock adapter validates required fields (sessionId, userMessage, agentState, environmentState, recentMessages), returns deterministic responses referencing agent displayName/personaPreset and environment preset, supports AbortSignal cancellation, and does not mutate session state. All 6 adapter tests pass (33 total across the project). Runs fully in-browser with no backend required.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-03 20:02

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-03 20:03

Focus: Feature Developer
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-03 20:09

Agent completed successfully in 383s (2682737 tokens)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-03 20:09

Run #1 [attempt=1, profile=default, role=fast -> InferenceAPI/nvidia/nvidia/Nemotron-3-Nano-30B-A3B]
- Turns: 88, Tool calls: 87
- Tokens: 2.7M in / 25.4K out [2.7M total]
- Cost: $0.0000
- Exit: normal, Duration: 6m 23s
- Log: TASK-7.1__20260603T200301Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 5
author: oompah
created: 2026-06-03 20:11

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 6
author: oompah
created: 2026-06-04 16:20

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
