---
id: TASK-3.2
title: Wire root Makefile gates to web app and document commands
status: Done
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-03 08:21'
labels: []
dependencies:
  - TASK-3.1
documentation:
  - plans/aethel_mvp_plan.md
  - README.md
  - docs/language-and-tooling.md
parent_task_id: TASK-3
priority: high
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Delivery Gates and Implementation Sequence.

WHAT TO DO
After web/ exists, replace the root Makefile placeholder quality gates with real commands that delegate to the Bun-managed web app scripts. Update README.md and any relevant docs with the actual Bun install, dev, build, test, lint, fmt, and fmt-check commands. Keep target names compatible with AGENTS.md: fmt, fmt-check, build, test, lint, and clean.

WHY
The repo workflow requires Makefile targets when they exist. The current targets intentionally fail because this repo started from a template. Once the web app exists, project contributors need real quality gates and accurate user-facing docs. Bun is the confirmed package manager and script runner.

HOW TO VERIFY
Run make fmt-check, make build, make test, and make lint from the repo root after running the documented Bun install command. Confirm README.md no longer says those targets are placeholders and instead shows the real Bun-based web app commands.

EDGE CASES AND PITFALLS
Do not remove make init or the Backlog.md setup behavior. If dependency installation is required before the gates pass, document the exact bun install command. Avoid adding commands that open browsers or prompt interactively.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Root Makefile quality gates run real web app commands.
- [x] #2 README/docs list actual install, dev, build, test, lint, and format commands.
- [x] #3 make fmt-check, make build, make test, and make lint pass from repo root.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: Ran make fmt-check, make build, make test, and make lint from the repo root - all passed successfully. Confirmed README.md now shows the actual Bun-based web app commands instead of placeholder descriptions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wire root Makefile gates to web app and document commands: Verified that Makefile targets already correctly delegate to web workspace Bun scripts. Updated README.md to reflect actual Bun-based commands instead of placeholder descriptions. All quality gates (fmt-check, build, test, lint) now pass from repo root.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-03 06:09

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-03 06:09

Focus: Maintenance Engineer
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-03 06:10

Run #1 [attempt=1, profile=default, role=fast -> Godspeed/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4]
- Turns: 0, Tool calls: 1
- Tokens: 0 in / 0 out [0 total]
- Cost: $0.0000
- Exit: terminated, Duration: 1m 9s
- Log: TASK-3.2__20260603T060945Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-03 06:17

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 5
author: oompah
created: 2026-06-03 06:17

Focus: Maintenance Engineer
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 6
author: oompah
created: 2026-06-03 06:42

Agent stalled 1 time(s) (1470s (191085 tokens)). Escalating from 'default' to 'standard'. Retrying in 10s (attempt #1)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 7
author: oompah
created: 2026-06-03 06:42

Run #1 [attempt=1, profile=default, role=fast -> Godspeed/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4]
- Turns: 15, Tool calls: 15
- Tokens: 190.3K in / 824 out [191.1K total]
- Cost: $0.0000
- Exit: stalled, Duration: 24m 30s
- Log: TASK-3.2__20260603T061743Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 8
author: oompah
created: 2026-06-03 06:42

Agent dispatched (profile: standard)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 9
author: oompah
created: 2026-06-03 06:42

Focus: Maintenance Engineer
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 10
author: oompah
created: 2026-06-03 07:51

Agent stalled 2 time(s) (4180s (893882 tokens)). Escalating from 'standard' to 'deep'. Retrying in 20s (attempt #2)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 11
author: oompah
created: 2026-06-03 07:51

Run #2 [attempt=2, profile=standard, role=standard -> Godspeed/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4]
- Turns: 42, Tool calls: 42
- Tokens: 889.5K in / 4.4K out [893.9K total]
- Cost: $0.0000
- Exit: stalled, Duration: 1h 9m 40s
- Log: TASK-3.2__20260603T064215Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 12
author: oompah
created: 2026-06-03 07:52

Retrying (attempt #2, agent: deep)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
