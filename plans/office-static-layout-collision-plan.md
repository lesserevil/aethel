# Office Static Layout Collision Plan

Status: Complete
Created: June 5, 2026

## Purpose

The standard office scene must be believable before dynamic physics exists.
After replacing the empty placeholder GLBs with real mesh-backed assets, the
default object transforms expose several obvious collider overlaps: laptop with
keyboard and coffee cup, keyboard with notebook, and desk lamp with book stack.

The current web MVP does not run a physics engine. It uses static transforms,
manifest dimensions, and lightweight AABB placement helpers. Therefore the
baseline office layout must be collision-free at load time instead of relying
on runtime simulation to resolve interpenetration.

## Scope

- Adjust only default office object positions in `web/src/state/baselineSession.ts`.
- Keep all ten MVP office objects enabled by default.
- Preserve the current browser-only, GPU-optional MVP runtime.
- Add unit coverage that fails when enabled default office objects overlap
  under `validatePlacement`.
- Update user-facing physics docs to state that the current MVP has static
  collider validation, not dynamic runtime physics.

## Out of Scope

- Adding Rapier, Cannon, Ammo, PhysX, Newton, or any other runtime physics
  engine to the web app.
- Gravity, stacking simulation, rigid body settling, or contact resolution.
- Drag/drop placement UI changes.
- Changing GLB mesh geometry or asset provenance.

## Verification Approach

Use the existing placement helpers as the source of truth for Tier 0 static
colliders. A baseline-layout regression should iterate over every enabled
object in `baselineSession.environment.objects`, call `validatePlacement` for
that object's current position against every other enabled object, and fail
with the conflicting object labels if any current default placement overlaps.

## Acceptance Criteria

- [x] CRIT-1: `baselineSession.environment.objects` has no enabled object pair
      that fails `validatePlacement` at its default position; covered by a
      unit test that names any conflicting pair.
- [x] CRIT-2: The standard office viewport still renders all ten default
      office objects and passes the Playwright nonblank/asset-request checks.
- [x] CRIT-3: User-facing physics documentation clearly states that the current
      MVP has static collider validation but no dynamic browser physics
      simulation.
- [x] CRIT-4: The default `make run` path remains browser-only and
      GPU-optional; no new runtime dependency is required.
