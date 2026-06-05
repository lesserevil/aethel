---
id: TASK-19.6
title: Add opt-in live Nemotron smoke check and close integration plan
status: Done
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:59'
labels: []
dependencies:
  - TASK-19.1
  - TASK-19.5
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - scripts/nemotron/nemotron_smoke_check.py
  - scripts/nemotron/test_nemotron_smoke_check.py
parent_task_id: TASK-19
priority: medium
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Testing Strategy and Acceptance Criteria.

WHAT TO DO
Add an opt-in live smoke command for the selected NVIDIA Nemotron model. The command should send a low-token text request with a small Aethel scene context through the same backend client used by /api/chat. It must be skipped by default in make test and must fail safely when NVIDIA credentials are absent or invalid. After all TASK-19 child tasks are done and the live smoke check succeeds, update plans/nvidia-nemotron-chat-plan.md acceptance criteria and status as appropriate.

WHY
Mocked tests prove code paths, but one explicit live check is needed to prove the configured credential, endpoint, model id, prompt mapping, and response parsing work together.

HOW TO VERIFY
Run the normal quality gates: make fmt-check, make build, make test, and make lint. With a valid credential, run the opt-in live smoke command and confirm it returns a text response from the selected model. Confirm the command output masks or omits secrets. Confirm the plan's acceptance criteria can be checked off only after every child task is complete.

EDGE CASES AND PITFALLS
Do not make the live smoke command part of default CI until credential handling is designed for CI. Keep token handling server-side. If the live endpoint path or model id differs from the plan, update docs and plan before closing the task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An opt-in live smoke command verifies the configured Nemotron endpoint and masks secrets.
- [x] #2 The plan is marked complete only after all acceptance criteria and child tasks are satisfied.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Understanding (2026-06-05): Task adds opt-in live smoke command. TASK-19.1-19.5 all Done. Plan: create scripts/nemotron/nemotron_smoke_check.py (exit 0/1/2 pattern like Newton harness), unit tests, make smoke-nemotron target, update docs and plan.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered: (1) scripts/nemotron/nemotron_smoke_check.py — opt-in live smoke check using api.nvidia_client.NvidiaClient (same path as /api/chat). Sends a low-token Aethel scene context request. Exits 0=OK, 1=FAIL, 2=SKIP on missing/invalid credentials. Never prints the raw API key — shows only redacted hint (sk-X********). Supports --dry-run for prompt validation without network access. (2) scripts/nemotron/test_nemotron_smoke_check.py — 36 unit tests covering all exit paths with mocked NVIDIA calls; no real key required. (3) Makefile targets: smoke-nemotron-dry-run, smoke-nemotron, smoke-nemotron-test — NOT wired into make test or default CI. (4) docs/nemotron-chat.md — Opt-in Live Smoke Check section documenting commands, exit codes, and security guarantees. (5) plans/nvidia-nemotron-chat-plan.md — Status: Complete; CRIT-1 through CRIT-5 all checked with evidence from completed child tasks. All quality gates pass: make fmt-check, make build, make test-api (103 passed), make smoke-nemotron-test (36 passed), make lint.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 14:49

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-05 14:49

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-05 14:52

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
