---
id: TASK-3.1
title: Scaffold Vite React TypeScript web workspace
status: Merged
assignee: []
created_date: 2026-06-02 22:11
updated_date: 2026-06-03 06:07
labels: []
dependencies: []
documentation:
- plans/aethel_mvp_plan.md
- docs/language-and-tooling.md
parent_task_id: TASK-3
priority: high
ordinal: 12000
oompah.task_costs:
  total_input_tokens: 54
  total_output_tokens: 16576
  total_cost_usd: 0.0
  by_model:
    unknown:
      input_tokens: 54
      output_tokens: 16576
      cost_usd: 0.0
  runs:
  - profile: default
    model: unknown
    input_tokens: 54
    output_tokens: 16576
    cost_usd: 0.0
    recorded_at: '2026-06-02T23:28:54.500491+00:00'
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Target Stack and Initial Web App Layout.

WHAT TO DO
Create the initial web/ workspace for the Aethel MVP using Bun, Vite, React, and TypeScript. Add package metadata, TypeScript config, Vite config, React entrypoint, a minimal App component, base CSS, and scripts for dev, build, typecheck, test, lint, fmt, and fmt-check. Use Bun as the package manager and script runner. Install or declare the initial frontend dependencies needed for React, Vitest, React Testing Library, Playwright, and React Three Fiber. Keep the app minimal; the actual three-column layout is a separate task.

WHY
The MVP is a browser app. A typed Vite/React workspace gives the project a concrete implementation home and makes later renderer, controls, chat, and tests build against the same toolchain. Bun is the confirmed package manager so all juniors use the same install and script commands.

HOW TO VERIFY
From web/, run bun install if dependencies are not installed, then run the configured typecheck/build/test scripts through bun. The root README and Makefile may still be updated by a follow-up task, but the web workspace itself should compile and run its placeholder test.

EDGE CASES AND PITFALLS
Do not scaffold a landing page or marketing site. Do not add Omniverse, Python, or backend dependencies in this task. Keep generated files scoped to web/ except for Bun lockfiles if Bun creates them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 web/ contains a Bun-managed Vite React TypeScript app with a working entrypoint.
- [x] #2 web/package.json exposes dev, build, typecheck, test, lint, fmt, and fmt-check scripts runnable through bun.
- [x] #3 The scaffolded app builds and has at least one passing placeholder test.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
UNDERSTANDING: Scaffolding web/ with Bun-managed Vite+React+TypeScript app. Scripts: dev, build, typecheck, test, lint, fmt, fmt-check. Deps: React, Vite, TypeScript, Vitest, React Testing Library, Playwright, Three.js, React Three Fiber. Verify with bun install + typecheck + build + test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scaffolded web/ Bun-managed Vite+React+TypeScript workspace. All 3 acceptance criteria met: (1) web/ has working entrypoint with React 18 + Vite 5 + TypeScript 5 + R3F + Three.js; (2) package.json exposes dev/build/typecheck/test/lint/fmt/fmt-check; (3) App builds successfully and 2 Vitest tests pass. Root Makefile wired to web/ scripts. All quality gates green: fmt-check, typecheck, lint, test (2/2), build.
<!-- SECTION:FINAL_SUMMARY:END -->

## Comments
<!-- COMMENTS:BEGIN -->
<!-- COMMENT:BEGIN -->
index: 1
author: oompah
created: 2026-06-02 23:21

Agent dispatched (profile: default)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 2
author: oompah
created: 2026-06-02 23:21

Focus: Integration Tests Session Specialist
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 3
author: oompah
created: 2026-06-02 23:28

Agent completed successfully in 425s (16630 tokens)
<!-- COMMENT:END -->
<!-- COMMENT:BEGIN -->
index: 4
author: oompah
created: 2026-06-02 23:28

Run #1 [attempt=1, profile=default, role=fast -> Claude/default]
- Turns: 87, Tool calls: 55
- Tokens: 54 in / 16.6K out [16.6K total]
- Cost: $0.0000
- Exit: normal, Duration: 7m 5s
- Log: TASK-3.1__20260602T232151Z.jsonl
<!-- COMMENT:END -->
<!-- COMMENTS:END -->
