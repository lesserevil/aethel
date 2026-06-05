---
id: TASK-19.3
title: Implement Nemotron client and Aethel prompt builder
status: Done
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:34'
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
- [x] #1 Backend Nemotron client maps Aethel chat requests to NVIDIA chat completions and returns the existing ChatResponse shape.
- [x] #2 Mocked tests cover context inclusion, success, provider errors, rate limits, malformed responses, and timeouts.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Implementing NVIDIA Nemotron chat client and Aethel prompt builder. Confirmed hosted model id: nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning. Creating api/nvidia_client.py (async httpx, error types, chat_template_kwargs reasoning off by default, typed multimodal extension point), api/prompt_builder.py (system+history+user from ChatRequest), updating api/main.py (real client when AETHEL_CHAT_PROVIDER=nvidia), adding test_nvidia_client.py + test_prompt_builder.py.

DISCOVERY: TASK-19.1 confirmed hosted model id is nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning. TASK-19.2 scaffolded FastAPI in api/ with placeholder /api/chat that returned stub response. EnvironmentState.objects was a free-form list; no selectedObject field existed — added it as Optional[str]. httpx was dev-only; needed in production requirements since it is used by the client at runtime. chat_template_kwargs: {thinking: false} is NVIDIA's documented way to disable chain-of-thought for reasoning models.

IMPLEMENTATION: Created api/nvidia_client.py (async httpx, 5-type error hierarchy, reasoning off by default via chat_template_kwargs, typed multimodal extension point for image_url/audio_url/video_url). Created api/prompt_builder.py (system+history+user messages from ChatRequest; ValueError guard on empty displayName/preset). Updated api/main.py to call real client when AETHEL_CHAT_PROVIDER=nvidia (default=mock). Added selectedObject Optional[str] to EnvironmentState. Added httpx to production requirements.txt.

VERIFICATION: 103 tests pass (make test-api). Covers: success, 401/403, 429, timeout, cancellation, malformed JSON, missing fields, key non-exposure, chat_template_kwargs, all prompt context fields, history bounding, role mapping, empty-field guards, all provider error→HTTP status mappings. No NVIDIA network access required.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered api/nvidia_client.py (async httpx client for NVIDIA OpenAI-compatible API, confirmed model id nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning, reasoning disabled by default via chat_template_kwargs, typed multimodal extension point, 5-type error hierarchy) and api/prompt_builder.py (system message with full agent/environment context, bounded history, current user message, ValueError guards). Updated api/main.py to call the real client when AETHEL_CHAT_PROVIDER=nvidia (mock remains default). Added selectedObject Optional[str] to EnvironmentState, httpx to production requirements. 103 tests pass: 27 client tests (success, 401/403, 429, timeout, cancellation, malformed, missing fields, key non-exposure, chat_template_kwargs), 30 prompt-builder tests (all context fields, selectedObject, history bounding, role mapping, empty-field guards), 8 new route tests (all provider error→HTTP mappings). No NVIDIA network access required for any test.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 14:24

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
