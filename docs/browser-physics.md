# Browser Physics — Rapier Engine

This document describes the browser-side runtime physics engine used by the
Aethel MVP scene, engine selection rationale, GPU requirements, and how to
integrate physics into a session.

---

## Selected Engine: Rapier 3D (WASM)

**Package:** `@dimforge/rapier3d-compat`  
**License:** Apache 2.0  
**Homepage:** https://rapier.rs  

Rapier 3D was selected as the browser runtime physics engine after evaluating
three options:

| Option | GPU Required | Browser-Native | Deterministic | Verdict |
|--------|-------------|----------------|---------------|---------|
| **Rapier/WASM** (`@dimforge/rapier3d-compat`) | **No** | **Yes** | Yes | **Selected** |
| Newton / NVIDIA Warp | Optional (CPU available) | **No** (Python, server-side) | Yes | Not suitable for browser |
| Omniverse / PhysX | **Yes** (GPU streaming) | No (server-side) | Yes | Out of scope for MVP |

### Why Rapier

1. **No GPU required.** Rapier runs entirely on CPU via WebAssembly. The WASM
   binary is inlined as base64 in the `@dimforge/rapier3d-compat` package —
   no network fetch, no CDN, no GPU driver needed.

2. **No network dependency.** Simulation runs client-side. The offline
   development workflow (`make run`) is unaffected.

3. **Deterministic.** Given the same inputs and step size, Rapier produces
   the same results across runs. This enables reproducible integration tests.

4. **Narrow interface.** The `PhysicsAdapter` TypeScript interface
   (`web/src/physics/physicsAdapter.ts`) means swapping Rapier for another
   engine (Cannon.js, Jolt, a future WASM Newton) requires changing only the
   adapter implementation, not the calling code.

5. **Manifest compatibility.** All physics metadata already present in the
   `officeAssetManifest` — `bodyType`, `colliderType`, `massKg`, `friction`,
   `restitution` — maps directly to Rapier rigid body and collider descriptors.

---

## GPU Requirements

| Component | GPU Required | Notes |
|-----------|-------------|-------|
| `RapierPhysicsAdapter` (browser) | **No** | CPU-only WebAssembly |
| `MinimalPhysicsAdapter` (tests) | **No** | Pure JavaScript, no WASM |
| `make run` (default MVP) | **No** | Physics adapter is opt-in |
| `make test` | **No** | All physics tests run on CPU |
| Newton evaluation harness (`make physics-harness`) | Optional | CPU backend available; see `docs/office-physics.md` |
| Omniverse / Isaac Sim | Yes | Not used in the browser MVP |

The default `make run` and `make test` paths do not require a GPU, CUDA,
Omniverse, or Newton.

---

## Architecture

```mermaid
flowchart TD
    A[officeAssetManifest\nbodyType, colliderType\ndimensions, mass, friction] -->|sceneObjectsToPhysicsBodyDefs| B[PhysicsBodyDef\ncenter-based Y]
    B -->|addBody| C[PhysicsAdapter interface]
    C -->|step dt| C
    C -->|getTransforms| D[PhysicsTransform\nserializable JSON]
    D -->|dispatch to session reducer| E[SceneObjectState.position\nbottom-based Y restored]

    C -.->|production| F[RapierPhysicsAdapter\n@dimforge/rapier3d-compat\nWASM, CPU-only]
    C -.->|unit tests| G[MinimalPhysicsAdapter\npure-JS Euler + AABB\nno WASM needed]
```

### Position convention

| Layer | Y convention | Why |
|-------|-------------|-----|
| `officeAssetManifest` | **Bottom-based** — `position.y` is the floor-level Y | Consistent with Three.js placement helpers |
| `PhysicsBodyDef` / Rapier | **Center-based** — `position.y` is the centroid | Standard for physics engines |
| `SceneObjectState` | **Bottom-based** | Session state mirrors the manifest |

The manifest mapping module (`web/src/physics/manifestPhysicsMapping.ts`)
converts between the two conventions:

```
physics_center_y = manifest_bottom_y + height / 2   (manifest → physics)
session_bottom_y = physics_center_y  - height / 2   (physics → session)
```

---

## File Layout

```
web/src/physics/
  physicsAdapter.ts             Narrow interface + I/O types
  manifestPhysicsMapping.ts     OfficeAssetEntry → PhysicsBodyDef conversion
  rapierPhysicsAdapter.ts       Production: Rapier WASM adapter
  minimalPhysicsAdapter.ts      Testing: pure-JS physics engine
  placementHelpers.ts           Existing: AABB placement validation (unchanged)
```

---

## Usage Example

```ts
import { RapierPhysicsAdapter } from "./physics/rapierPhysicsAdapter";
import { sceneObjectsToPhysicsBodyDefs, physicsTransformToSessionPosition }
  from "./physics/manifestPhysicsMapping";
import { getAssetById } from "./assets/officeAssetManifest";

const physics = new RapierPhysicsAdapter();
await physics.init(); // load WASM once per session

// Populate from session state
const defs = sceneObjectsToPhysicsBodyDefs(session.environment.objects);
defs.forEach(def => physics.addBody(def));

// Simulation loop (called per frame)
function onFrame(dt: number) {
  physics.step(dt);

  const transforms = physics.getTransforms();
  for (const t of transforms) {
    const asset = getAssetById(sessionObject.assetId);
    if (!asset) continue;
    const sessionPos = physicsTransformToSessionPosition(t.position, asset.dimensions.height);
    // dispatch(updateObjectPosition({ id: t.id, position: sessionPos }));
  }
}

// On scene reset
function onReset() {
  physics.reset();
}
```

### Key constraints

- **Do not** pass Three.js objects to `addBody()`. The interface accepts only
  plain `PhysicsBodyDef` values.
- **Do not** use render meshes as physics meshes by default. The manifest
  `colliderType` (`box`, `cylinder`) specifies the simple shape to use.
- **Do not** block the render loop on `init()`. Await it during app
  initialization, before the first frame.
- `step()` is synchronous and must not exceed ~0.1 s per call.

---

## Running Physics Tests

```bash
# All web tests including physics adapter tests
make test

# Watch mode (useful during development)
cd web && bun run test:watch
```

The physics tests run without a GPU, without Newton, and without any optional
dependencies. They are included in the default `make test` target.

---

## Collider Shape Mapping

| Manifest `colliderType` | Rapier collider | MinimalPhysicsAdapter |
|------------------------|----------------|----------------------|
| `box` | `ColliderDesc.cuboid(hw, hh, hd)` | AABB box |
| `cylinder` | `ColliderDesc.cylinder(hh, radius)` | AABB box approximation |
| `convexHull` | `ColliderDesc.cuboid(hw, hh, hd)` ¹ | AABB box approximation |
| `trimesh` | `ColliderDesc.cuboid(hw, hh, hd)` ¹ | AABB box approximation |
| `none` | Not added to simulation | Not added to simulation |

¹ `convexHull` and `trimesh` are approximated as bounding boxes until USD mesh
data is available for convex decomposition (planned for Tier 2 of the physics
simulation plan).

---

## Related Documents

- `plans/browser-runtime-physics-plan.md` — engine evaluation and design
  rationale.
- `plans/office-physics-simulation-plan.md` — simulation tiers, Newton
  evaluation, and USD physics metadata.
- `docs/office-physics.md` — Newton server-side evaluation harness.
- `docs/office-assets.md` — office prop asset catalogue.
