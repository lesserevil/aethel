---
id: TASK-19.7
title: Proxy Vite API requests to the Nemotron backend
status: Done
assignee: []
created_date: '2026-06-05 15:31'
updated_date: '2026-06-05 15:42'
labels: []
dependencies:
  - TASK-19.5
documentation:
  - plans/nvidia-nemotron-chat-plan.md
modified_files:
  - web/vite.config.ts
  - web/src/viteConfig.test.ts
  - README.md
  - docs/nemotron-chat.md
parent_task_id: TASK-19
priority: high
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/nvidia-nemotron-chat-plan.md § Local Development and Runtime Architecture.

WHAT TO DO
Fix local dev-server wiring so the frontend API chat adapter can reach the FastAPI backend. Update web/vite.config.ts to proxy /api requests from the Vite dev server on port 5173 to the backend on http://127.0.0.1:8000. Add a focused test that verifies the /api proxy target. Update README.md and docs/nemotron-chat.md only where needed so the local live Nemotron workflow accurately explains that the browser posts to /api/chat through the Vite dev-server proxy.

WHY
The frontend apiChatAdapter posts to /api/chat. Without a Vite proxy, local browser testing receives Vite index.html instead of the FastAPI /api/chat response, so the model-backed UI path cannot be tested even though the backend works directly.

HOW TO VERIFY
Run make fmt-check, make build, make test, and make lint. Start the backend with AETHEL_CHAT_PROVIDER=nvidia and the frontend with VITE_CHAT_PROVIDER=api, then confirm http://127.0.0.1:5173/api/health returns the backend JSON health response instead of Vite index.html. Send one browser-origin or curl request through http://127.0.0.1:5173/api/chat and confirm it reaches the backend.

EDGE CASES AND PITFALLS
Do not expose NVIDIA_API_KEY or any credential through Vite. The proxy target should be a local backend URL only. Keep mock mode as the default when VITE_CHAT_PROVIDER is unset.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vite dev server proxies /api requests to the local FastAPI backend without exposing credentials.
- [x] #2 A test verifies the /api proxy target in Vite config.
- [x] #3 Docs describe the Vite proxy behavior accurately for local Nemotron testing.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a Vite dev-server /api proxy to http://127.0.0.1:8000, covered it with a focused Vitest config check, and updated README/docs so local Nemotron testing explains that the browser calls /api/chat through Vite. Verified /api/health and /api/chat through http://127.0.0.1:5173 with backend 200 responses.
<!-- SECTION:FINAL_SUMMARY:END -->
