# USD Physics Metadata Field Reference

This document describes the custom metadata fields and USD Physics API schemas
used in the Aethel office prop USDA files (`assets/usd/office/props/*.usda`).

Fields that map to a standard USD Physics schema are marked **[USD Physics]**.
Fields without a standard schema are stored in the prim's `customData` dictionary
and are marked **[custom]**. Both kinds are validated by `scripts/assets/validate-usd.py`.

---

## Standard USD Physics API Schemas

Applied via `prepend apiSchemas` on the root Xform prim.

### `PhysicsCollisionAPI` [USD Physics]

Marks the prim (and its collision child prim) as participating in physics
collision detection. Required on every office prop.

### `PhysicsRigidBodyAPI` [USD Physics]

Marks the prim as a fully-simulated rigid body driven by physics forces.
Applied **only** to dynamic props (bodyType = "dynamic"). Static props must
**not** carry this schema — they are fixed in world space.

### `physics:approximation` token [USD Physics]

Used on the collision child prim (e.g., `def Mesh "ColliderConvexHull"`) to
request a specific collision approximation from the physics engine:

| Value              | Meaning                                              |
|--------------------|------------------------------------------------------|
| `"convexHull"`     | Engine computes a convex hull from the mesh points   |
| `"meshSimplification"` | Engine simplifies the mesh                       |
| `"sdf"`            | Signed-distance-field collider (high quality)        |

Box and cylinder shapes use `def Cube` / `def Cylinder` prims directly and do
not need `physics:approximation`.

---

## Custom Metadata Fields (in `customData`)

Stored in the root Xform prim's `customData = { ... }` dictionary.
These are stable field names — rename them only with a migration plan and
matching update to `scripts/assets/validate-usd.py`.

### `string physicsBodyType` [custom]

Maps to the `BodyType` union in `web/src/state/sessionTypes.ts`.

| Value        | Meaning                                                 |
|--------------|---------------------------------------------------------|
| `"static"`   | Fixed in world space, infinite effective mass           |
| `"kinematic"`| Programmatically driven, not physics-force-driven       |
| `"dynamic"`  | Fully simulated — gravity, forces, and collisions apply |

Heavy furniture (desk, chair, lamp, monitor) must be `"static"`.
Small clutter and devices (laptop, keyboard, trash can, books, cup, notebook)
must be `"dynamic"`.

### `string physicsColliderType` [custom]

Maps to the `ColliderType` union in `web/src/state/sessionTypes.ts`.

| Value          | Collision primitive                                       |
|----------------|-----------------------------------------------------------|
| `"box"`        | `def Cube "ColliderBox"` scaled to the bounding box       |
| `"cylinder"`   | `def Cylinder "ColliderCylinder"` with radius and height  |
| `"convexHull"` | `def Mesh "ColliderConvexHull"` with `physics:approximation = "convexHull"` |
| `"trimesh"`    | Full triangle mesh — avoid unless explicitly needed       |
| `"none"`       | No collision volume                                       |

Prefer simple shapes. Use trimesh only when a test documents why the simpler
shape is inadequate.

### `float3 physicsDimensions` [custom]

Approximate bounding box dimensions in meters: `(width, height, depth)`.
Matches `dimensions` in the TypeScript manifest. Used by the validator to
confirm a dimension is present; physics engines use the actual collider prim
geometry.

### `string semanticLabel` [custom]

Human-readable description of the object. Used by agents and USD pipelines
for object identification. Matches `semanticLabel` in the TypeScript manifest.

### `string assetId` [custom]

Stable identifier that ties this USD prim to the corresponding entry in
`web/src/assets/officeAssetManifest.ts`. Must match the `id` field of the
manifest entry exactly.

### `string category` [custom]

Broad semantic category. One of `"furniture"`, `"device"`, `"container"`,
or `"clutter"`. Matches `category` in the TypeScript manifest.

### `bool agentSafe` [custom]

Whether the agent may pick up, move, or interact with this object without
risking environmental damage or session instability.

- `false` — heavy furniture (desk, chair, lamp, monitor)
- `true` — small clutter and light devices (laptop, keyboard, trash can, etc.)

### `string[] affordances` [custom]

List of semantic affordance tags. Matches `affordances` in the TypeScript
manifest. Supported values (see `Affordance` type in `sessionTypes.ts`):

| Tag               | Meaning                                              |
|-------------------|------------------------------------------------------|
| `"seatable"`      | Agent or user can sit on this object                 |
| `"work-surface"`  | Object provides a flat surface for placing items     |
| `"input-device"`  | Object accepts text/control input (keyboard, laptop) |
| `"waste-container"` | Object holds discarded items                      |
| `"light-source"`  | Object emits light                                   |
| `"storage"`       | Object stores other items (drawer, shelf)            |
| `"pickup"`        | Agent may pick up and reposition this object         |
| `"displayable"`   | Object renders or surfaces information (monitor)     |
| `"containable"`   | Object can hold other objects (cup, tray)            |

### `float physicsMassKg` [custom] (dynamic props only)

Object mass in kilograms. **Required** for `physicsBodyType = "dynamic"`.
Omit for static or kinematic props. Maps to `massKg` in the TypeScript manifest.

### `float physicsFriction` [custom] (optional)

Coulomb friction coefficient (0 = frictionless, 1 = high friction).
Present when a non-default value is needed for simulation accuracy.
Maps to `friction` in the TypeScript manifest.

### `float physicsRestitution` [custom] (optional)

Coefficient of restitution (0 = perfectly inelastic, 1 = perfectly elastic).
Present when a non-default value is needed.
Maps to `restitution` in the TypeScript manifest.

---

## Validation

`scripts/assets/validate-usd.py` checks every required prop USDA file for:

1. File existence under `assets/usd/office/props/`.
2. `customData` containing all required fields with correct types.
3. `prepend apiSchemas` includes `PhysicsCollisionAPI`.
4. Dynamic props also have `PhysicsRigidBodyAPI` in `apiSchemas`.
5. Dynamic props have `physicsMassKg` set to a positive value.

Run `make assets-validate` to invoke the validator. It exits 0 on success and
1 on any validation failure, printing a clear error message per failure.

---

## Future: OpenUSD Schema Alignment

When OpenUSD Python bindings are available (`pip install usd-core`), the
validator can be enhanced to load the stage and inspect prims using the USD
Python API. Until then, the text-based validator in `validate-usd.py` is the
ground truth. Fields stored in `customData` are stable — do not rename them
without updating both the USDA files and the validator.
