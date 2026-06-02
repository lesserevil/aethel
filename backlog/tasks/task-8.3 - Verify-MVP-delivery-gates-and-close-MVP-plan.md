---
id: TASK-8.3
title: Verify MVP delivery gates and close MVP plan
status: To Do
assignee: []
created_date: '2026-06-02 22:12'
labels: []
dependencies:
  - TASK-8.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-8
priority: medium
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Acceptance Criteria and Delivery Gates.

WHAT TO DO
After all MVP implementation tasks are complete, verify every acceptance criterion in plans/aethel_mvp_plan.md. Run the root quality gates, run the browser/e2e tests, manually inspect the app, and update the MVP plan status to Complete only if all criteria are satisfied. If any acceptance criterion is not satisfied, leave the plan Draft and create standalone Backlog.md follow-up tasks that explain the remaining work.

WHY
A plan is complete only when its acceptance criteria are demonstrably satisfied, not merely when implementation tasks are marked Done. This task creates the final project-level gate for the MVP.

HOW TO VERIFY
Run make fmt-check, make build, make test, and make lint. Run the documented e2e command. Open the app and confirm the three-column UI, visible 3D agent/environment, control mutations, chat context, renderer boundary, and tests all meet the plan. Then update plans/aethel_mvp_plan.md status to Complete if everything passes.

EDGE CASES AND PITFALLS
Do not mark the plan complete because most tasks are done. Do not close acceptance criteria based only on screenshots if tests are required. If quality gates are still placeholders, the MVP is not complete.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All MVP plan acceptance criteria are verified with tests or documented manual checks.
- [ ] #2 Root quality gates and e2e tests pass.
- [ ] #3 MVP plan status is updated to Complete only when every criterion is satisfied, otherwise follow-up tasks are filed.
<!-- AC:END -->
