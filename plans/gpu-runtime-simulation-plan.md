# GPU Runtime Simulation Plan

Status: Draft
Created: June 5, 2026
Updated: June 5, 2026

## Purpose

Aethel's current web MVP uses static transforms and lightweight collider
validation. It does not simulate gravity, rigid body contact, stacking, or
object settling in the browser.

The next realistic-world simulation work should now assume a GPU-capable
simulation host. The browser remains the interaction surface and lightweight
viewer, but high-fidelity runtime physics, sensor simulation, RTX rendering,
and training-oriented world stepping should be designed around a server-side
NVIDIA GPU instead of a CPU-only browser physics engine.

## Direction

Prefer a GPU-backed simulation backend over browser-native production physics.
The first evaluation should compare Newton/Warp on CUDA, Omniverse Physics /
PhysX, and Isaac Sim or Omniverse Kit workflows against a browser-native engine
such as Rapier. Rapier may still be useful for test doubles or local fallback
visualization, but it should not become the primary realistic-world simulator.

The GPU requirement applies to the simulation host/server side. The web client
should not require CUDA, OptiX, RTX hardware, Omniverse Kit, Isaac Sim, or
Newton just to open the MVP. Until a production simulation service is wired
into `make run`, the existing web MVP remains available as a static viewer with
static collider validation only.

## Scope

- Define the minimum GPU-backed simulation host profile: NVIDIA GPU, driver,
  CUDA/runtime expectations, and whether containerized execution is required.
- Compare Newton/Warp CUDA, Omniverse Physics / PhysX, and Isaac Sim or
  Omniverse Kit as the production simulation direction for office-world
  rigid-body interactions.
- Use OpenUSD as the scene contract between asset authoring, simulation, and
  web rendering.
- Map existing `officeAssetManifest` collider/body metadata and canonical USD
  physics metadata into the selected simulator.
- Keep heavy furniture static and small clutter dynamic for the first smoke
  scene.
- Produce serializable transform/state snapshots that the browser can consume
  without making Three.js objects the source of truth.
- Document what remains available on CPU-only machines: the current MVP
  viewer, static collider validation, asset validation, and dry-run harnesses.

## Out of Scope

- Replacing the current browser MVP with Omniverse streaming in this planning
  task.
- Requiring a GPU on the browser/client side beyond normal WebGL rendering.
- Autonomous robot body simulation, grasping, path planning, or sensors beyond
  the minimum smoke scene.
- High-fidelity collision meshes from render geometry by default.
- Treating CPU-only browser physics as the production realistic-world path.

## Acceptance Criteria

- [ ] CRIT-1: User-facing docs and the plan identify the affected side as the
      server/simulation host and state that high-fidelity runtime simulation
      work now requires an NVIDIA GPU, while the current static MVP viewer
      remains CPU/server-GPU optional.
- [ ] CRIT-2: A written engine recommendation compares Newton/Warp CUDA,
      Omniverse Physics / PhysX, Isaac Sim or Omniverse Kit, and browser-only
      Rapier for office-world simulation, including GPU, licensing,
      headless/server operation, OpenUSD compatibility, and testability.
- [ ] CRIT-3: A prototype or smoke harness instantiates the standard office
      scene from manifest/USD physics metadata on a GPU-capable simulation
      path and proves one dynamic prop falls or resolves contact against a
      static surface.
- [ ] CRIT-4: The GPU smoke path has clear skip/fail behavior when no suitable
      GPU is present, and its output tells the operator exactly which
      requirement is missing.
- [ ] CRIT-5: Browser session state remains serializable and existing object
      selection, toggles, reset behavior, mutation log, and chat context
      continue to pass their current tests.
