---
id: TASK-19
title: Integrate NVIDIA Nemotron chat model
status: Backlog
assignee: []
created_date: '2026-06-05 13:40'
labels:
  - epic
dependencies: []
documentation:
  - plans/nvidia-nemotron-chat-plan.md
priority: high
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Purpose and Runtime Architecture.

WHAT TO DO
Coordinate the first real model integration for Aethel chat. This is an epic-style parent task; implement it through the child tasks. The completed work should verify the NVIDIA Nemotron model endpoint, add a backend /api/chat boundary that keeps credentials server-side, call the selected Nemotron 3 Nano Omni model with Aethel scene context, allow the frontend to choose mock or backend chat, document the workflow, and provide an opt-in live smoke check.

WHY
Aethel's chat panel currently uses a deterministic mock. A real model is needed for agent interaction, but the NVIDIA key from ~/.netrc cannot be exposed to the browser or committed into the repo.

HOW TO VERIFY
All child tasks under this parent are Done. Confirm plans/nvidia-nemotron-chat-plan.md acceptance criteria CRIT-1 through CRIT-5 are satisfied. Run the normal project quality gates, then run the opt-in live smoke check only after a valid NVIDIA credential exists.

EDGE CASES AND PITFALLS
Do not put NVIDIA credentials in Vite env vars, frontend bundles, logs, task files, docs, or commits. Keep mock mode working when the backend, network, or credential is unavailable. The current ~/.netrc credential probe failed with HTTP 401 because the endpoint expected a LiteLLM virtual key starting with sk-; do not assume live calls work until that is resolved.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A backend-backed Nemotron adapter can answer chat with Aethel scene context while keeping credentials server-side.
- [ ] #2 The frontend can still run in mock mode and can opt into the backend adapter without changing ChatPanel's contract.
- [ ] #3 Docs and tests cover credentials, backend runtime, provider selection, and live smoke verification.
<!-- AC:END -->
