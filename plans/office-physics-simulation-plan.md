# Office Physics Simulation Plan

Status: Draft
Created: June 5, 2026

## Purpose

Aethel eventually needs a realistic simulation world where agents can
inhabit, inspect, navigate, and manipulate objects. The first standard
office should therefore gain physics metadata and interaction affordances
in stages.

The current MVP does not require server-side GPU physics. Static office
props, object toggles, and visual inspection can run with the existing
browser renderer. Newton, PhysX, Isaac Sim, and RTX rendering become
valuable after the project has OpenUSD assets with colliders, semantics,
and behaviors worth simulating.

## Simulation Tiers

### Tier 0: Static Web Colliders

Use simple manifest-backed colliders in the web MVP:

- box colliders for desks, laptops, keyboards, books, and trash cans;
- cylinder or box colliders for cups and lamps;
- seat/work-surface/input-device affordance labels;
- raycast selection and placement guards where useful.

Tier 0 does not require Newton, PhysX, USD Physics, or a GPU.

### Tier 1: USD Physics Metadata

Once `plans/usd-scene-pipeline-plan.md` has canonical office USD assets,
add simulation metadata:

- static versus dynamic body type;
- collision approximation;
- mass for movable objects;
- friction and restitution;
- semantic labels;
- affordances such as `seatable`, `pickup`, `work-surface`,
  `input-device`, and `waste-container`.

Static heavy furniture should stay static. Small clutter can become
dynamic only after collision meshes are stable.

### Tier 2: Local Interaction Prototype

Add a limited interaction prototype before full simulation:

- select object;
- highlight collider;
- move or snap an object to a valid work surface;
- prevent obvious overlaps using simple collider tests;
- record the interaction as a mutation in the existing session state.

This tier can still run entirely in the browser or through a lightweight
local adapter. It should not introduce a GPU server dependency.

### Tier 3: Newton Evaluation

Evaluate Newton when Aethel needs contact-rich simulation, robot
learning, differentiable physics, or scalable training loops. Newton is a
good candidate because it is open source, built on NVIDIA Warp and
OpenUSD, and targets robotics and simulation research.

The first Newton task should be an evaluation harness, not a production
runtime migration. It should prove:

- the selected office USD assets can load or be converted into a Newton
  scene;
- colliders and mass/friction metadata survive the path;
- a deterministic smoke simulation can run locally;
- GPU requirements are documented separately from the default MVP.

### Tier 4: Omniverse/PhysX/Isaac Runtime

Use PhysX, Isaac Sim, or Omniverse Kit when Aethel needs higher-fidelity
robotics simulation, sensor simulation, RTX rendering, or streaming
runtime integration. This is not part of the first office asset rollout.

## Metadata Contract

Physics metadata should start in the same asset manifest used by the web
runtime, then be mirrored into USD as the USD pipeline matures.

Each interactive object should define:

- `bodyType`: static, kinematic, or dynamic;
- `colliderType`: box, cylinder, convex hull, trimesh, or none;
- approximate dimensions in meters;
- optional mass in kilograms;
- optional friction and restitution;
- affordance labels;
- object category and semantic label;
- whether the object is safe for agent manipulation.

Do not use high-detail render meshes as physics meshes by default.
Prefer simple colliders until validation proves a more complex collider
is needed.

## Agent Interaction Scope

The first useful office interactions are:

- the agent can refer to visible objects by label;
- the user can select an object in the viewport;
- the system can tell whether an object is seatable, a work surface, an
  input device, a container, or clutter;
- simple object placement avoids obvious overlap;
- mutation history records object moves or state changes.

Autonomous manipulation, path planning, drawer/door articulation, and
robot bodies are later work.

## Testing and Verification

Required verification grows by tier:

- Tier 0: unit tests for collider metadata, component tests for object
  selection/highlight, and Playwright checks for nonblank rendering after
  toggles or placement.
- Tier 1: USD validation checks that selected props have physics
  metadata and that render meshes are not accidentally used as complex
  colliders without an explicit exception.
- Tier 2: deterministic collision/placement tests with known positions.
- Tier 3: a Newton smoke test that is skipped cleanly when optional
  dependencies or GPU support are unavailable.

The default `make run` and current MVP browser workflow must continue to
work without a GPU.

## Out of Scope

- Full robotics simulation.
- Multi-agent navigation.
- Cloth, soft bodies, fluids, destructible props, or deformable objects.
- Production Omniverse streaming.
- Requiring GPU physics for the standard web MVP.

## Backlog Implementation Map

- TASK-18: Add office physics metadata and simulation evaluation path.
- TASK-18.1: Add physics-ready collider and affordance metadata.
- TASK-18.2: Implement web object selection and simple collider-aware
  placement.
- TASK-18.3: Author USD Physics metadata for standard office props.
- TASK-18.4: Create an optional Newton office-scene smoke harness.
- TASK-18.5: Verify the default MVP remains GPU-optional.

## Sources Reviewed

Reviewed June 5, 2026:

- NVIDIA Newton Physics:
  https://developer.nvidia.com/newton-physics
- Newton GitHub repository:
  https://github.com/newton-physics/newton
- SimReady FAQ:
  https://docs.omniverse.nvidia.com/simready/latest/simready-faq.html
- Omniverse Asset Validator:
  https://docs.omniverse.nvidia.com/kit/docs/asset-validator/latest/source/python/docs/index.html

## Acceptance Criteria

- [ ] CRIT-1: Manifest-backed office assets define collider type,
      dimensions, body type, and affordance metadata for every
      interactive prop; covered by manifest/unit tests.
- [ ] CRIT-2: The web MVP can select/highlight office objects and enforce
      simple collider-aware placement or overlap checks without requiring
      Newton, PhysX, Omniverse Kit, or a GPU.
- [ ] CRIT-3: The canonical office USD assets include physics metadata
      for the first desk, chair, laptop, keyboard, monitor/screen, trash
      can, and three clutter/accessory props; verified by a USD
      validation script.
- [ ] CRIT-4: A Newton evaluation harness exists with a deterministic
      smoke simulation, clear optional dependency handling, and docs that
      state whether CPU-only and GPU-backed runs are available on the
      tested machine.
- [ ] CRIT-5: The default MVP run path remains browser-only and
      GPU-optional; verified by `make run` and the existing MVP quality
      gates.
