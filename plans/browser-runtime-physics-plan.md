# Browser Runtime Physics Plan

Status: Complete
Created: June 5, 2026

## Purpose

Add browser-side runtime physics to the Aethel standard office scene so
dynamic props can fall, stack, and settle without requiring a GPU, server-side
Newton, or Omniverse. This plan evaluates engine options and defines the
adapter interface that maps existing `officeAssetManifest` metadata to physics
objects.

The MVP web workflow (`make run`) must continue to work on CPU-only hardware.

---

## Scope

- **Engine evaluation**: compare browser-native Rapier/WASM against delegating
  all physics to Newton or Omniverse.
- **Adapter interface**: a narrow TypeScript interface (`PhysicsAdapter`) that
  keeps session state serializable and prevents Three.js coupling.
- **Manifest mapping**: convert `OfficeAssetEntry` metadata
  (`bodyType`, `colliderType`, dimensions, mass, friction, restitution) to
  `PhysicsBodyDef` objects for the adapter.
- **Deterministic test**: prove one dynamic prop can fall and resolve contact
  with a static surface without a GPU.
- **User docs**: update `docs/browser-physics.md` to state the selected engine
  and GPU requirements.

Out of scope: full robotics simulation, multi-agent navigation, cloth/fluid
simulation, or Omniverse streaming.

---

## Engine Evaluation

### Option A: Rapier 3D (WASM)

**Repository:** https://github.com/dimforge/rapier  
**npm package:** `@dimforge/rapier3d-compat`  
**License:** Apache 2.0

#### Advantages
- Runs entirely in the browser via WebAssembly — **no GPU required**.
- The `-compat` package ships WASM inlined as base64, which works in Node.js
  and all modern browsers without a separate fetch/import.
- Deterministic: fixed-point arithmetic option; reproducible step sequences.
- Feature complete: rigid bodies, compound colliders, joints, character
  controller, raycasts, shape casts.
- Active community, first-class TypeScript bindings, well-documented API.
- Apache 2.0 — compatible with the project license.

#### Disadvantages
- WASM init is asynchronous (one-time cost at session start).
- Does not share code with Newton/Omniverse; a future port would need a
  separate adapter.
- Not differentiable; cannot directly serve robot learning objectives.

### Option B: Newton / NVIDIA Warp (server-side only)

**Already evaluated in:** `plans/office-physics-simulation-plan.md` Tier 3.  
Newton is a Python/CUDA library — it cannot run in the browser.  Any Newton
physics result would have to be computed server-side and streamed to the
browser, adding latency and requiring a server GPU for production-quality
simulation.

#### Verdict for browser MVP
Newton cannot satisfy the requirement of in-browser, GPU-optional physics.
Newton remains the recommended path for server-side robot learning and
contact-rich simulation once the USD pipeline is mature (Tier 3).

### Option C: Omniverse / PhysX

Omniverse Kit runs server-side and requires a GPU.  Streaming physics state to
the browser introduces significant complexity and breaks the offline/local
development workflow.  Out of scope for the browser MVP.

### Decision: Rapier 3D

Rapier/WASM is selected as the browser runtime physics engine for the following
reasons:

1. **Zero GPU requirement** — runs on any CPU supporting WebAssembly.
2. **No network dependency** — runs entirely client-side.
3. **Deterministic** — enables reproducible integration tests.
4. **Narrow interface** — the `PhysicsAdapter` interface means swapping engines
   later (e.g., to Cannon.js, Jolt, or a future WASM Newton) is a one-file
   change.
5. **Manifest compatibility** — all metadata already present in
   `officeAssetManifest` (`bodyType`, `colliderType`, `massKg`, `friction`,
   `restitution`) maps directly to Rapier rigid body and collider descriptors.

---

## Architecture

```mermaid
flowchart TD
    A[officeAssetManifest\nOfficeAssetEntry] -->|sceneObjectsToPhysicsBodyDefs| B[PhysicsBodyDef[]]
    C[SceneObjectState\nposition, rotation] --> B
    B -->|addBody| D[PhysicsAdapter interface]
    D -->|step dt| D
    D -->|getTransforms| E[PhysicsTransform[]\nserializable JSON]
    E -->|position update| F[SessionState\nSceneObjectState]
    D -.->|production| G[RapierPhysicsAdapter\nWASM, CPU-only]
    D -.->|testing| H[MinimalPhysicsAdapter\npure-JS, CPU-only]
```

### Position convention

The `officeAssetManifest` and existing `buildAABB` use **bottom-based Y**:
`position.y` is the floor-level Y of the object. Physics engines typically
use **center-based Y**. The manifest mapping layer (`manifestPhysicsMapping.ts`)
converts on entry:

```
center_y = bottom_y + height / 2
```

This conversion is confined to the mapping layer; neither the adapter interface
nor the session state types change.

### Session state contract

Physics results are plain serializable objects (`PhysicsTransform`) — position
and rotation as `{ x, y, z }` number triplets. The caller is responsible for
writing results back into `SceneObjectState` using normal session reducers.
The physics engine itself never holds a reference to React state or Three.js
objects.

---

## File Layout

```
web/src/physics/
  placementHelpers.ts          (existing — AABB placement validation)
  placementHelpers.test.ts     (existing)
  physicsAdapter.ts            (new — narrow interface + types)
  manifestPhysicsMapping.ts    (new — OfficeAssetEntry → PhysicsBodyDef)
  manifestPhysicsMapping.test.ts (new)
  minimalPhysicsAdapter.ts     (new — pure-JS engine for tests)
  minimalPhysicsAdapter.test.ts (new — deterministic fall + contact tests)
  rapierPhysicsAdapter.ts      (new — Rapier WASM adapter for browser)
  rapierPhysicsAdapter.test.ts (new — interface-level adapter tests)
```

---

## GPU Requirement Statement

**Browser physics (Rapier):** No GPU required. Runs on CPU via WebAssembly.
The WASM module is inlined in `@dimforge/rapier3d-compat` and needs no
external fetch, CDN, or GPU driver.

**Newton (server-side):** Optional GPU. CPU backend available. Not used in
the browser MVP.

**`make run` and `make test`:** Remain GPU-optional. The Rapier adapter is
not imported by any default application boot path — it must be explicitly
constructed by a caller that needs simulation. The existing placement helpers
and session state are unchanged.

---

## Acceptance Criteria

- [x] CRIT-1: A browser physics engine recommendation (Rapier/WASM) is
      documented with GPU requirement implications in this plan and in
      `docs/browser-physics.md`.
- [x] CRIT-2: `PhysicsAdapter` TypeScript interface is defined in
      `web/src/physics/physicsAdapter.ts`; `RapierPhysicsAdapter` and
      `MinimalPhysicsAdapter` both implement it; neither imports Three.js
      or exposes non-serializable state.
- [x] CRIT-3: `manifestPhysicsMapping.ts` maps every manifest entry's
      `bodyType`, `colliderType`, dimensions, mass, friction, and restitution
      to a `PhysicsBodyDef`; covered by `manifestPhysicsMapping.test.ts`.
- [x] CRIT-4: `minimalPhysicsAdapter.test.ts` contains a deterministic test
      that starts a dynamic prop above a static floor, steps the simulation,
      and asserts the prop has fallen and settled — passing with no GPU,
      no WASM, no browser environment. (Test: "CRIT-4: dynamic box falls
      and settles on static floor (deterministic)")
- [x] CRIT-5: `make test` passes (all existing + new tests, 1096 total);
      `make run` requires no GPU or GPU-related env vars.
