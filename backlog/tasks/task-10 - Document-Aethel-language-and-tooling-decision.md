---
id: TASK-10
title: Document Aethel language and tooling decision
status: Done
assignee: []
created_date: '2026-06-02 22:09'
updated_date: '2026-06-02 22:13'
labels: []
dependencies: []
documentation:
  - docs/language-and-tooling.md
  - docs/README.md
  - plans/aethel_mvp_plan.md
modified_files:
  - docs/language-and-tooling.md
  - docs/README.md
  - plans/aethel_mvp_plan.md
  - README.md
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/aethel_mvp_plan.md § Implementation Notes and Implementation Plan.

WHAT TO DO
Add user-facing documentation for the project language decision. Document TypeScript as the primary MVP language, React/Vite for the web app, Three.js or React Three Fiber for the browser 3D viewport, Python/FastAPI as the future backend and NVIDIA integration language, and C++ as a reserved option for later performance-critical Omniverse/Kit extension work. Link the new doc from docs/README.md and reflect the decision in the MVP plan.

WHY
The project needs an explicit tooling direction before implementation tasks are executed. Developers should not infer whether the MVP starts in JavaScript, TypeScript, Python, C++, or an Omniverse-only stack.

HOW TO VERIFY
Read docs/language-and-tooling.md and confirm it names the language split, rationale, initial stack, future backend path, and non-goals. Confirm docs/README.md links to the new doc and plans/aethel_mvp_plan.md includes the language decision.

EDGE CASES AND PITFALLS
Do not imply that the Python backend or Omniverse integration exists today. Do not choose C++ for the MVP unless a specific performance-critical native extension is being implemented.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/language-and-tooling.md documents TypeScript as primary MVP language.
- [x] #2 docs/language-and-tooling.md documents Python backend/NVIDIA integration role and C++ reserved role.
- [x] #3 docs/README.md and the MVP plan reference the language decision.
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/language-and-tooling.md with the TypeScript-first MVP decision, Python backend/NVIDIA integration path, C++ reserved role, initial stack, backend path, non-goals, and references. Linked it from docs/README.md, README.md, and plans/aethel_mvp_plan.md.
<!-- SECTION:FINAL_SUMMARY:END -->
