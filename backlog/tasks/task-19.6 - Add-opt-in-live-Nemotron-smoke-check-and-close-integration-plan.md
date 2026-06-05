---
id: TASK-19.6
title: Add opt-in live Nemotron smoke check and close integration plan
status: Backlog
assignee: []
created_date: '2026-06-05 13:41'
labels: []
dependencies:
  - TASK-19.1
  - TASK-19.5
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - scripts
  - docs/nemotron-chat.md
  - plans/nvidia-nemotron-chat-plan.md
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
- [ ] #1 An opt-in live smoke command verifies the configured Nemotron endpoint and masks secrets.
- [ ] #2 The plan is marked complete only after all acceptance criteria and child tasks are satisfied.
<!-- AC:END -->
