# Browser Runtime Physics Plan

Status: Draft
Created: June 5, 2026

## Purpose

Aethel's current web MVP uses static transforms and lightweight collider
validation. It does not simulate gravity, rigid body contact, stacking, or
object settling in the browser. A future runtime physics pass should add those
behaviors without making the default MVP require a local or server-side GPU.

## Direction

Evaluate a browser-native physics engine before wiring any production behavior.
The likely starting point is Rapier because it runs in WebAssembly, has a
JavaScript API, supports rigid bodies and colliders, and does not require a GPU.
The evaluation should compare Rapier against the cost of keeping physics only
in Newton/Omniverse server-side workflows.

## Scope

- Add a browser physics adapter behind a small local interface.
- Map existing manifest collider metadata to runtime rigid bodies and colliders.
- Keep heavy furniture static and small clutter dynamic.
- Step physics deterministically inside the viewport render loop or a dedicated
  simulation tick.
- Synchronize resulting transforms back to serializable session state only when
  necessary.
- Keep `make run` working without GPU, CUDA, Omniverse, Newton, or Isaac Sim.

## Out of Scope

- Robot body simulation.
- Server-side Omniverse streaming.
- Newton/PhysX production migration.
- GPU-mandatory simulation.
- High-fidelity collision meshes from render geometry.

## Acceptance Criteria

- [ ] CRIT-1: A browser physics adapter exists behind a narrow local interface
      with tests that can run in the default web test suite.
- [ ] CRIT-2: The standard office scene can instantiate static bodies for desk,
      chair, monitor, and lamp, and dynamic bodies for laptop, keyboard, trash
      can, book stack, coffee cup, and notebook from the typed asset manifest.
- [ ] CRIT-3: A deterministic component or integration test proves one dynamic
      object falls or resolves contact without overlapping a static surface.
- [ ] CRIT-4: User-facing docs state that browser runtime physics is available,
      name the engine used, and explicitly confirm no client or server GPU is
      required for the default MVP path.
- [ ] CRIT-5: Existing object selection, toggles, reset behavior, mutation log,
      and chat context continue to pass their current tests.
