---
id: TASK-20
title: Add pytest-asyncio to backend dev dependencies
status: Done
assignee: []
created_date: '2026-06-05 15:39'
updated_date: '2026-06-05 15:42'
labels:
  - tooling
  - no-plan-required
dependencies: []
modified_files:
  - api/requirements-dev.txt
priority: high
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
WHAT TO DO
Add the pytest-asyncio package to api/requirements-dev.txt so the existing pytest.mark.asyncio tests in api/tests/test_nvidia_client.py are executed by the backend test target.

WHY
make test-api currently runs with pytest but fails 24 async NVIDIA client tests because pytest does not know how to run async test functions without the pytest-asyncio plugin. This is a local development/test setup issue, not a runtime dependency.

HOW TO VERIFY
Install api/requirements-dev.txt into the repo Python environment, then run PATH="$PWD/.venv/bin:$PATH" make test-api from the repo root. The backend test suite should pass without Unknown pytest.mark.asyncio warnings.

EDGE CASES AND PITFALLS
Keep pytest-asyncio in api/requirements-dev.txt only. Do not add it to api/requirements.txt because the production API server does not need pytest plugins.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 api/requirements-dev.txt includes pytest-asyncio as a development-only test dependency.
- [x] #2 PATH="$PWD/.venv/bin:$PATH" make test-api passes from the repo root.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added pytest-asyncio to api/requirements-dev.txt as a dev-only dependency and verified PATH="$PWD/.venv/bin:$PATH" make test-api passes with 103 backend tests.
<!-- SECTION:FINAL_SUMMARY:END -->
