---
id: TASK-19.2
title: Scaffold backend chat service and secure config loading
status: Done
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:24'
labels: []
dependencies: []
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - api
  - Makefile
  - docs/nemotron-chat.md
parent_task_id: TASK-19
priority: high
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Runtime Architecture and Configuration.

WHAT TO DO
Create the first backend service boundary for model-backed chat, preferably under api/ using Python and FastAPI unless a narrower implementation decision is documented in this task. Add an /api/health endpoint and a placeholder /api/chat route that validates the expected request shape without calling NVIDIA yet. Add configuration loading that can read NVIDIA_API_KEY from the environment or a machine inference-api.nvidia.com entry in ~/.netrc, but never prints the secret. Add Makefile targets needed to run or test the backend, such as run-api and test-api, and document the exact commands in docs/nemotron-chat.md.

WHY
NVIDIA credentials cannot live in browser TypeScript. A backend boundary is required so Aethel can call real model providers while keeping the frontend ChatAdapter contract stable.

HOW TO VERIFY
Run make help and confirm the new backend targets appear. Run the backend tests, including config-loading tests that use fake netrc data and assert the key is masked or omitted in errors. Run make fmt-check, make build, make test, and make lint if the new targets are included in those gates.

EDGE CASES AND PITFALLS
Do not require a real NVIDIA key for unit tests. Do not add the key to Vite env vars. If make run changes to start both frontend and backend, update README.md in the same task; otherwise keep make run behavior unchanged and document run-api separately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A backend /api/health and placeholder /api/chat service exists with tested secret-safe config loading.
- [ ] #2 Makefile and docs expose non-interactive backend run/test commands without requiring a live NVIDIA key.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Creating FastAPI backend under api/ with /api/health + placeholder /api/chat (validation only, no NVIDIA calls). Config loading reads NVIDIA_API_KEY from env or ~/.netrc for inference-api.nvidia.com, never logs the secret. Adding run-api/test-api Makefile targets and docs/nemotron-chat.md. Tests use fake netrc data to verify key masking without requiring live credentials.

IMPLEMENTATION: Created api/ (FastAPI backend) with: config.py (secure NVIDIA_API_KEY loading from env or ~/.netrc, never logs secret), models.py (Pydantic models mirroring TS ChatRequest/ChatResponse), main.py (/api/health + placeholder /api/chat with full request validation), requirements.txt, requirements-dev.txt. Tests (34 total): api/tests/test_config.py covers all credential paths + secret masking assertions; api/tests/test_routes.py covers endpoint behavior, HTTP status codes, and key non-exposure. Makefile: added run-api (uvicorn) and test-api (pytest) targets. Added docs/nemotron-chat.md with full setup, env vars, API reference, and troubleshooting.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered FastAPI backend service under api/ with: GET /api/health (liveness + key presence flag), POST /api/chat (full Pydantic request validation, stub response, 503 when key absent). Secure config loading in api/config.py reads NVIDIA_API_KEY from env or ~/.netrc (inference-api.nvidia.com machine entry) and never logs the secret — redacted_key_hint() returns sk-******* style output only. 34 passing tests (no real NVIDIA key required): 16 config tests covering all resolution paths + secret-masking assertions, 18 route tests covering status codes, validation, and key non-exposure. Makefile run-api and test-api targets added; make run and existing frontend gates unchanged. docs/nemotron-chat.md documents prerequisites, credential setup, env vars, endpoint reference, and troubleshooting.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 14:17

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
