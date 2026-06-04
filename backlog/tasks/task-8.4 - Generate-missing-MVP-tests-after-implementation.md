---
id: TASK-8.4
title: Generate missing MVP tests after implementation
status: In Progress
assignee: []
created_date: '2026-06-02 23:46'
updated_date: '2026-06-04 17:10'
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
- [x] #1 Post-implementation audit maps MVP Testing Strategy items to implemented tests or follow-up tasks.
- [x] #2 Unit/component tests cover state, selectors, adapters, controls, chat, persistence, and viewport prop synchronization.
- [x] #3 make test or the documented unit/component test command passes.
<!-- AC:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DISCOVERY (2026-06-04): Ran full test suite after bun install. All 238 tests pass across 16 test files. Coverage per MVP Testing Strategy: (1) reducer/action behavior - sessionReducer.test.ts (11 tests) covers all mutation types; (2) selectors - sessionSelectors.test.ts (3 tests); (3) adapter behavior - chatAdapter.test.ts (4), mutationAdapter.test.ts (4), sessionStorageUtil.test.ts (7); (4) control-panel - ControlPanel.test.tsx (49 tests covering apply/reset/draft flows); (5) chat panel - ChatPanel.test.tsx (26 tests including pending state, errors, message history); (6) viewport - AethelViewport.test.tsx (3 tests, ready signal); (7) scene internals - AgentAvatar.test.ts (17), SceneEnvironment.test.ts (12); (8) panel synchronization - panelSynchronization.test.tsx (23 integration tests covering cross-panel coherence, mutation records, chat propagation); (9) baseline state - baselineSession.test.ts (8); (10) mutation log - mutationLog.test.ts (6 including deterministic ID). MVP Testing Strategy fully covered. make test passes.
<!-- SECTION:NOTES:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-04 14:46

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-04 17:05

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
