---
id: TASK-18.13
title: Evaluate GPU-required runtime simulation for the office scene
status: Open
assignee: []
created_date: '2026-06-05 16:35'
updated_date: '2026-06-05 16:46'
labels: []
dependencies: []
documentation:
  - plans/gpu-runtime-simulation-plan.md
modified_files:
  - plans/gpu-runtime-simulation-plan.md
  - plans/office-physics-simulation-plan.md
  - plans/README.md
  - docs/office-physics.md
  - README.md
parent_task_id: TASK-18
priority: medium
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan: plans/gpu-runtime-simulation-plan.md § Direction and § Scope.

WHAT TO DO
Evaluate and prototype the first GPU-required runtime simulation path for the standard office scene. Compare Newton/Warp on CUDA, Omniverse Physics / PhysX, and Isaac Sim or Omniverse Kit as production simulation candidates. Include browser-only Rapier/WASM only as a baseline or fallback option, not as the preferred realistic-world simulator. Define the minimum server/simulation-host GPU profile, map existing officeAssetManifest and USD Physics metadata into the selected simulation path, and prove one dynamic prop can fall or resolve contact against a static surface.

WHY
The current MVP only has static transforms and AABB placement validation. Aethel eventually needs a realistic sim world for agents to inhabit and manipulate, and the project direction has now crossed from CPU-only optional simulation toward GPU-required high-fidelity runtime simulation. The GPU requirement is on the server/simulation host, not the browser client.

HOW TO VERIFY
Produce a written recommendation that compares the candidate engines, GPU requirements, OpenUSD compatibility, headless/server operation, licensing constraints, and testability. Add or update a smoke harness/prototype that either runs on a GPU-capable path or skips/fails with a clear missing-GPU message. Run the relevant Makefile quality gates for any touched code, and confirm the current make run MVP still opens without requiring CUDA, Omniverse, Isaac Sim, Newton, or a server-side GPU.

EDGE CASES AND PITFALLS
Do not make Three.js render objects the source of truth for physics. Keep session state serializable and synchronize simulation output through explicit snapshots or events. Do not require a client-side CUDA/RTX GPU. Do not remove the CPU-only static MVP fallback unless a later task explicitly updates README.md and docs/office-physics.md with the new default runtime requirement. Do not use render meshes as physics meshes by default; prefer manifest/USD collider metadata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GPU-backed simulation engine recommendation compares Newton/Warp CUDA, Omniverse Physics / PhysX, Isaac Sim or Omniverse Kit, and browser-only Rapier with server/client GPU implications.
- [ ] #2 Prototype or smoke harness maps office manifest/USD physics metadata to a selected GPU-capable simulation path and proves dynamic contact or falling behavior.
- [ ] #3 User docs state the server/simulation-host GPU requirement, the current static make run fallback, and clear skip/fail behavior when no suitable GPU is present.
<!-- AC:END -->
