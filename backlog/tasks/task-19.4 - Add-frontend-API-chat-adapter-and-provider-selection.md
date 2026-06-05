---
id: TASK-19.4
title: Add frontend API chat adapter and provider selection
status: Backlog
assignee: []
created_date: '2026-06-05 13:41'
labels: []
dependencies:
  - TASK-19.3
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - web/src/services/chatAdapter.ts
  - web/src/app/ChatPanel.tsx
parent_task_id: TASK-19
priority: high
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Runtime Architecture and Configuration.

WHAT TO DO
Add a frontend API-backed ChatAdapter that posts the existing ChatRequest shape to /api/chat and maps the backend response to ChatResponse. Preserve mockChatAdapter as the default fallback. Add a provider selection mechanism that can choose mock or backend API mode without exposing NVIDIA credentials in Vite config. Update ChatPanel only if needed to inject the selected adapter through an existing boundary or a small adapter factory.

WHY
The UI should be able to use a real model without knowing about NVIDIA auth, model ids, or provider response shapes. Mock mode must stay available for offline development and tests.

HOW TO VERIFY
Add frontend tests with fetch mocked for successful backend response, backend error response, network failure, abort handling, and fallback to mock mode. Existing chat e2e tests should continue to pass in mock mode. Run make test and make build.

EDGE CASES AND PITFALLS
Do not put NVIDIA_API_KEY or any token into import.meta.env variables. Do not remove the deterministic mock adapter because many tests and offline workflows depend on it. Preserve ChatPanel's public props and behavior unless tests are updated for an intentional contract change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Frontend can use /api/chat through a ChatAdapter while preserving mock mode as default fallback.
- [ ] #2 Tests prove API success, failure, abort, and mock fallback behavior without real network calls.
<!-- AC:END -->
