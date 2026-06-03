---
id: TASK-8.5
title: Add GitHub Actions CI for MVP quality gates
status: Open
assignee: []
created_date: '2026-06-02 23:46'
updated_date: '2026-06-03 05:53'
labels: []
dependencies:
  - TASK-3.2
  - TASK-8.2
  - TASK-8.4
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-8
priority: medium
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Delivery Gates and Testing Strategy.

WHAT TO DO
After the web app scripts, Makefile gates, unit/component tests, and Playwright e2e tests exist, add GitHub Actions CI under .github/workflows/. The workflow should run on pull requests and pushes to dev. It must install Bun, install web dependencies, run the root quality gates, and run the documented e2e command. At minimum CI should run make fmt-check, make build, make test, make lint, and the Playwright/e2e command once TASK-8.2 defines it. Configure non-interactive Playwright browser installation if required.

WHY
Local tests are not enough once the repository is public and work happens on branches. CI should enforce the same MVP gates expected by the plan so regressions are caught before merging to dev.

HOW TO VERIFY
Push a branch or open a pull request and confirm GitHub Actions runs the workflow. Confirm the workflow fails if a quality gate fails or if the e2e test fails. Confirm the workflow passes on the completed MVP implementation. Document any required CI setup in README.md or docs if the workflow needs special commands.

EDGE CASES AND PITFALLS
Do not add this before TASK-3.2 and TASK-8.2 define real commands; placeholder Makefile targets will fail. Do not rely on interactive browser installation. Keep secrets out of the workflow unless a later real model/backend task requires them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A GitHub Actions workflow runs on pull requests and pushes to dev.
- [ ] #2 CI installs Bun and runs make fmt-check, make build, make test, make lint, and the documented e2e command.
- [ ] #3 README or docs describe any CI-specific setup required by the workflow.
<!-- AC:END -->
