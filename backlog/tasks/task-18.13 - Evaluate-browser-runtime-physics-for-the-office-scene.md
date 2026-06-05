---
id: TASK-18.13
title: Evaluate browser runtime physics for the office scene
status: Open
assignee: []
created_date: '2026-06-05 16:35'
labels: []
dependencies: []
documentation:
  - plans/browser-runtime-physics-plan.md
parent_task_id: TASK-18
priority: medium
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/browser-runtime-physics-plan.md § Scope.

WHAT TO DO
Evaluate and prototype browser-side runtime physics for the standard office scene without changing the default MVP into a GPU-required workflow. Start by comparing a browser-native engine such as Rapier/WASM against keeping physics only in Newton or Omniverse workflows. If Rapier is selected, add a small local adapter interface, map existing officeAssetManifest collider/body metadata to rigid bodies and colliders, and prove one dynamic prop can fall or resolve contact against a static surface in a deterministic test.

WHY
The current MVP only has static transforms and AABB placement validation. It can prevent obvious default overlaps, but it does not simulate gravity, stacking, collisions, or settling at runtime. Aethel eventually needs a realistic sim world for agents to inhabit and manipulate.

HOW TO VERIFY
Run the default web tests and any new physics adapter tests through make test. Confirm make run still works without GPU, CUDA, Omniverse, Newton, or Isaac Sim. Add or update user docs to state the selected engine and GPU requirements before landing production behavior.

EDGE CASES AND PITFALLS
Do not couple browser physics directly to Three.js objects; keep session state serializable. Do not use render meshes as physics meshes by default. Do not introduce GPU-mandatory dependencies for the default MVP. Preserve object toggles, reset behavior, selection, mutation logging, and chat context.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A browser physics engine recommendation is documented with GPU requirement implications.
- [ ] #2 Prototype adapter maps manifest colliders/body types to runtime physics objects behind a narrow interface.
- [ ] #3 A deterministic test proves dynamic contact or falling behavior without requiring a GPU.
<!-- AC:END -->
