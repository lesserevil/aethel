---
id: TASK-4.3
title: Add MVP local service adapters and session persistence
status: In Progress
assignee: []
created_date: 2026-06-02 22:11
updated_date: 2026-06-04 17:03
labels:
- merge-conflict
dependencies:
- TASK-4.2
documentation:
- plans/aethel_mvp_plan.md
parent_task_id: TASK-4
ordinal: 17000
oompah.task_costs:
  total_input_tokens: 95
  total_output_tokens: 25297
  total_cost_usd: 0.0
  by_model:
    unknown:
      input_tokens: 95
      output_tokens: 25297
      cost_usd: 0.0
  runs:
  - profile: default
    model: unknown
    input_tokens: 50
    output_tokens: 17572
    cost_usd: 0.0
    recorded_at: '2026-06-04T16:49:24.941047+00:00'
  - profile: standard
    model: unknown
    input_tokens: 45
    output_tokens: 7725
    cost_usd: 0.0
    recorded_at: '2026-06-04T17:01:26.956855+00:00'
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § API and Persistence Path.

WHAT TO DO
Create local service adapters under web/src/services/. Implement mutationAdapter for validating and normalizing control-panel mutation payloads before they reach the reducer. Implement sessionStorage helpers for saving/loading the current SessionState to browser storage, with versioning or defensive parsing. Define TypeScript interfaces for future REST-backed session and mutation APIs without requiring a backend in this task.

WHY
The MVP can start in-browser, but service boundaries should exist before UI code grows around direct state edits. Persistence also makes manual testing and demos less fragile.

HOW TO VERIFY
Run unit tests for mutation validation and session persistence. Tests should cover valid payloads, invalid payload rejection, missing/corrupt local storage data, and round-tripping a baseline session.

EDGE CASES AND PITFALLS
Do not make UI components import browser storage directly. Do not persist provider credentials or model API details. Defensive parsing should fall back to baseline state rather than crashing the app on old or corrupt saved state.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 mutationAdapter validates and normalizes control-panel mutation payloads.
- [ ] #2 sessionStorage helpers load/save serializable SessionState with defensive parsing.
- [ ] #3 Tests cover valid, invalid, missing, and corrupt persistence cases.
<!-- AC:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 16:20

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-04 16:20

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-04 16:42

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-04 16:42

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 5
author: oompah
created: 2026-06-04 16:49

Agent completed successfully in 410s (17622 tokens)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 6
author: oompah
created: 2026-06-04 16:49

Run #1 [attempt=1, profile=default, role=fast -> Claude/default]
- Turns: 97, Tool calls: 61
- Tokens: 50 in / 17.6K out [17.6K total]
- Cost: $0.0000
- Exit: normal, Duration: 6m 50s
- Log: TASK-4.3__20260604T164236Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 7
author: oompah
created: 2026-06-04 16:52

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 8
author: oompah
created: 2026-06-04 16:53

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 9
author: oompah
created: 2026-06-04 16:54

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 10
author: oompah
created: 2026-06-04 16:55

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 11
author: oompah
created: 2026-06-04 16:56

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 12
author: oompah
created: 2026-06-04 16:57

Agent dispatched (profile: standard)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 13
author: oompah
created: 2026-06-04 16:57

Focus: Merge Conflict Resolver
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 14
author: oompah
created: 2026-06-04 17:01

Agent completed successfully in 258s (7770 tokens)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 15
author: oompah
created: 2026-06-04 17:01

Run #YOLO-reopen [attempt=YOLO-reopen, profile=standard, role=standard -> Claude/default]
- Turns: 77, Tool calls: 53
- Tokens: 45 in / 7.7K out [7.8K total]
- Cost: $0.0000
- Exit: normal, Duration: 4m 18s
- Log: TASK-4.3__20260604T165710Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 16
author: oompah
created: 2026-06-04 17:01

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 17
author: oompah
created: 2026-06-04 17:02

YOLO: Merge conflict detected on MR #20. Rebase onto dev and resolve conflicts.
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 18
author: oompah
created: 2026-06-04 17:03

Agent dispatched (profile: standard)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
