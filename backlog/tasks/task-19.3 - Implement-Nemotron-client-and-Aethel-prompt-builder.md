---
id: TASK-19.3
title: Implement Nemotron client and Aethel prompt builder
status: In Progress
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:27'
labels: []
dependencies:
  - TASK-19.2
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - api
parent_task_id: TASK-19
priority: high
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Prompt Contract and Model Decision.

WHAT TO DO
Implement the backend NVIDIA client and prompt builder. The client should call the confirmed OpenAI-compatible NVIDIA chat completion endpoint using the selected model string nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4 unless TASK-19.1 records a different confirmed hosted model id. The prompt builder must include the visible agent's display name, persona preset, tone, behavior settings, environment preset, lighting/time, enabled office objects, selected object if present, recent chat history, and current user message. Disable reasoning output by default using NVIDIA's documented chat_template_kwargs or the confirmed equivalent so normal chat returns only the final answer.

WHY
Aethel needs real model responses that are grounded in the current scene and agent state, but provider-specific request/response details should stay behind the backend adapter.

HOW TO VERIFY
Add backend unit tests with mocked HTTP responses for success, timeout, 401/403, 429, malformed response, and cancellation/timeout behavior. Add prompt-builder tests that fail if agent or environment context is omitted. Run the backend test target and the standard project test target.

EDGE CASES AND PITFALLS
Do not log prompts with secrets or authorization headers. Do not expose chain-of-thought or raw reasoning traces in the user-visible response. Do not make default tests hit NVIDIA's network. Keep a typed extension point for future image_url/audio_url/video_url inputs, but do not upload viewport screenshots automatically in this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend Nemotron client maps Aethel chat requests to NVIDIA chat completions and returns the existing ChatResponse shape.
- [ ] #2 Mocked tests cover context inclusion, success, provider errors, rate limits, malformed responses, and timeouts.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Implementing NVIDIA Nemotron chat client and Aethel prompt builder. Confirmed hosted model id: nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning. Creating api/nvidia_client.py (async httpx, error types, chat_template_kwargs reasoning off by default, typed multimodal extension point), api/prompt_builder.py (system+history+user from ChatRequest), updating api/main.py (real client when AETHEL_CHAT_PROVIDER=nvidia), adding test_nvidia_client.py + test_prompt_builder.py.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 14:24

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
