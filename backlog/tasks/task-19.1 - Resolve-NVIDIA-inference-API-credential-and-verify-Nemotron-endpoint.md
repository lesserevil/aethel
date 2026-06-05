---
id: TASK-19.1
title: Resolve NVIDIA inference API credential and verify Nemotron endpoint
status: Needs Human
assignee: []
created_date: '2026-06-05 13:41'
labels: []
dependencies: []
references:
  - >-
    https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-nano-omni-30b-a3b-reasoning
documentation:
  - plans/nvidia-nemotron-chat-plan.md
parent_task_id: TASK-19
priority: high
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Model Decision and Credential Status.

WHAT TO DO
Replace or repair the local credential for machine inference-api.nvidia.com in ~/.netrc so it contains a valid NVIDIA/LiteLLM virtual key for the NVIDIA API endpoint. Do not commit the credential. Verify the selected model is reachable through the NVIDIA API using a low-token request. The selected model route is nvidia/nemotron-3-nano-omni-30b-a3b-reasoning, and NVIDIA's OpenAI-compatible examples use model string nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4. Record only the HTTP status, model id, endpoint path, and non-secret outcome in the task final summary.

WHY
A live probe against https://inference-api.nvidia.com/v1/models failed with HTTP 401 because the current netrc credential did not match the expected sk- virtual key shape. Aethel cannot complete the live model integration until a valid credential exists, but the secret must never enter source control or task text.

HOW TO VERIFY
Run a command equivalent to curl --netrc-file ~/.netrc https://inference-api.nvidia.com/v1/models and confirm it authenticates. Then send a minimal text chat completion to the selected Nemotron model and confirm a text response is returned. Do not paste the credential or full authorization header into logs, docs, commits, or Backlog.

EDGE CASES AND PITFALLS
The ~/.netrc entry may have login/password fields that are not obvious from sanitized inspection; verify behavior with curl, not by printing the secret. If NVIDIA's hosted endpoint path differs from /v1/chat/completions, record the confirmed path in the task final summary and update plans/nvidia-nemotron-chat-plan.md before implementation tasks depend on it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Authenticated model-list or model-info request succeeds against inference-api.nvidia.com without exposing the key.
- [ ] #2 A minimal text request to the selected Nemotron model returns a text response.
<!-- AC:END -->
