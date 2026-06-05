---
id: TASK-19.5
title: Document Nemotron runtime workflow and dev server wiring
status: Backlog
assignee: []
created_date: '2026-06-05 13:41'
labels: []
dependencies:
  - TASK-19.4
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - README.md
  - docs/nemotron-chat.md
  - docs/language-and-tooling.md
  - Makefile
parent_task_id: TASK-19
priority: medium
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Local Development and Testing Strategy.

WHAT TO DO
Update user-facing docs for the real Nemotron chat workflow. Explain mock mode, backend API mode, how credentials are loaded from NVIDIA_API_KEY or ~/.netrc, how to start the backend, how to start the web app, and how to run tests. If the implementation changes make run to start both web and backend, document that behavior in README.md and keep the command non-interactive. If make run remains frontend-only, document the separate run-api workflow clearly. Update docs/language-and-tooling.md if the backend service changes the current backend path decision.

WHY
Adding a real model changes the way developers and users operate the MVP. The docs must make the secure path easy and must not imply that secrets belong in frontend config.

HOW TO VERIFY
Run make help and compare the docs against actual targets. Run make fmt-check, make build, make test, and make lint. Read the docs and confirm they do not contain secrets or stale command names.

EDGE CASES AND PITFALLS
Do not document commands that do not exist. Do not show a real token in examples; use placeholders like sk-... only. If live smoke tests are optional, label them optional so normal quality gates do not fail without credentials.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README/docs accurately describe mock mode, backend Nemotron mode, credential loading, run commands, and test commands.
- [ ] #2 Docs include no real secret values and no stale command names.
<!-- AC:END -->
