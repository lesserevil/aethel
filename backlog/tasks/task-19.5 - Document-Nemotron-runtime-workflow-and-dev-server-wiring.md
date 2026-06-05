---
id: TASK-19.5
title: Document Nemotron runtime workflow and dev server wiring
status: In Progress
assignee: []
created_date: '2026-06-05 13:41'
updated_date: '2026-06-05 14:44'
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
Understanding: TASK-19.4 done - delivered docs/nemotron-chat.md, api/ FastAPI backend (make run-api/test-api), frontend apiChatAdapter (VITE_CHAT_PROVIDER). Gaps to fix: README missing run-api/test-api docs and link to nemotron-chat.md; nemotron-chat.md missing VITE_CHAT_PROVIDER frontend env var; language-and-tooling.md still says do-not-add-backend but backend is shipped.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README/docs accurately describe mock mode, backend Nemotron mode, credential loading, run commands, and test commands.
- [ ] #2 Docs include no real secret values and no stale command names.
<!-- AC:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-05 14:43

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
