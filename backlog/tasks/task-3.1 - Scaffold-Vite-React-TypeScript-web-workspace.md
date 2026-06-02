---
id: TASK-3.1
title: Scaffold Vite React TypeScript web workspace
status: To Do
assignee: []
created_date: '2026-06-02 22:11'
updated_date: '2026-06-02 23:05'
labels: []
dependencies: []
documentation:
  - plans/aethel_mvp_plan.md
  - docs/language-and-tooling.md
parent_task_id: TASK-3
priority: high
ordinal: 12000
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
- [ ] #1 web/ contains a Bun-managed Vite React TypeScript app with a working entrypoint.
- [ ] #2 web/package.json exposes dev, build, typecheck, test, lint, fmt, and fmt-check scripts runnable through bun.
- [ ] #3 The scaffolded app builds and has at least one passing placeholder test.
<!-- AC:END -->
