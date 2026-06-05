---
id: TASK-19.5
title: Document Nemotron runtime workflow and dev server wiring
status: Done
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:49'
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
Delivered: (1) README.md — added Nemotron Chat section with mock-only quickstart and step-by-step 4-terminal Nemotron mode guide, added run-api and test-api to make targets table, linked to docs/nemotron-chat.md, updated Implementation Decisions. (2) docs/nemotron-chat.md — split env vars into backend and frontend sections, added VITE_CHAT_PROVIDER with web/.env.local example, expanded Current Status into named Mock-only and Live Nemotron mode subsections. (3) docs/language-and-tooling.md — updated Backend Path to note backend was explicitly added in TASK-19, updated Non-Goals to remove stale do-not-add-backend bullet and add do-not-embed-NVIDIA-credentials bullet. All docs verified against make help, make build, make test-api. No real secrets; only sk-... placeholder in examples.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 README/docs accurately describe mock mode, backend Nemotron mode, credential loading, run commands, and test commands.
- [x] #2 Docs include no real secret values and no stale command names.
<!-- AC:END -->
