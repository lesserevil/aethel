---
id: TASK-8.4
title: Generate missing MVP tests after implementation
status: In Progress
assignee: []
created_date: '2026-06-02 23:46'
updated_date: '2026-06-04 14:52'
labels: []
dependencies:
  - TASK-4.3
  - TASK-5.2
  - TASK-6.1
  - TASK-6.2
  - TASK-7.2
documentation:
  - plans/aethel_mvp_plan.md
parent_task_id: TASK-8
priority: high
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Testing Strategy and Acceptance Criteria.

WHAT TO DO
After the MVP feature implementation tasks are complete, audit the delivered web app against the MVP Testing Strategy and generate any missing tests. Review reducer/state code, selectors, local service adapters, left control panel, center viewport boundary, right chat panel, and session persistence. Add or update Vitest and React Testing Library tests so the implemented behavior is covered, including baseline state, reducer actions, mutation records, chat context selectors, adapter errors, control apply/reset flows, and viewport prop updates. This task is a post-implementation test gap-filling task, not a replacement for the feature-specific tests required by earlier tasks.

WHY
Feature tasks require tests, but gaps often appear once the implementation is assembled. This task gives the team an explicit final pass to generate missing unit and component coverage before relying on e2e tests and CI.

HOW TO VERIFY
Run the documented unit/component test command and make test once TASK-3.2 has wired Makefile gates. Confirm tests fail if core state mutations, chat context propagation, control-panel apply/reset behavior, or viewport prop synchronization are broken. Summarize any remaining untested behavior in a follow-up Backlog task instead of silently accepting the gap.

EDGE CASES AND PITFALLS
Do not add shallow tests that only assert components mount. Prefer behavior-level assertions. Use deterministic clocks/IDs for mutation logs. Stub the renderer for component tests; full canvas verification belongs in Playwright e2e tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Post-implementation audit maps MVP Testing Strategy items to implemented tests or follow-up tasks.
- [ ] #2 Unit/component tests cover state, selectors, adapters, controls, chat, persistence, and viewport prop synchronization.
- [ ] #3 make test or the documented unit/component test command passes.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete: Added 55 new tests (215 total, was 160). New test file: web/src/components/controls/ControlPanel.test.tsx (49 tests covering environment controls rendering, draft state, apply/reset flows, mutation records, system messages, object toggles). Added 4 tests to mutationLog.test.ts (custom idGenerator, deterministic output). Added 2 tests to sessionReducer.test.ts (agent_full_change deep merge). All 215 tests pass.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 14:46

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
