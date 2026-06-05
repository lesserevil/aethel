// minimalPhysicsAdapter.ts
// Pure-JavaScript minimal physics adapter for deterministic testing and
// CPU-only environments.
//
// Implements the PhysicsAdapter interface using:
//   - Semi-implicit Euler integration for dynamic bodies.
//   - AABB contact detection and Minimum Translating Vector (MTV) resolution
//     between dynamic and static/kinematic bodies.
//   - No WebAssembly, no GPU, no browser API dependencies.
//
// When to use MinimalPhysicsAdapter vs RapierPhysicsAdapter:
//   ┌─────────────────────────────┬──────────────────────────────────────┐
//   │ MinimalPhysicsAdapter       │ RapierPhysicsAdapter                 │
//   ├─────────────────────────────┼──────────────────────────────────────┤
//   │ Vitest / Node.js tests      │ Browser production sessions          │
//   │ No WASM required            │ Requires WASM (inlined base64)       │
//   │ Deterministic (exact float) │ Deterministic (fixed-point option)   │
//   │ Box colliders only          │ Box, cylinder, convex hull, trimesh  │
//   │ No friction/restitution     │ Full material properties             │
//   │ tuning needed               │ from Rapier configuration            │
//   └─────────────────────────────┴──────────────────────────────────────┘
//
// Position convention: CENTER-based in meters. Matches PhysicsBodyDef.
//
// See plans/browser-runtime-physics-plan.md § Architecture.

import type { PhysicsAdapter, PhysicsBodyDef, PhysicsTransform } from "./physicsAdapter";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Standard gravity in m/s². Applied to dynamic bodies on the Y axis. */
const GRAVITY_Y = -9.81;

/**
 * Velocity components below this threshold are zeroed to simulate body sleep.
 * Prevents floating-point drift from keeping bodies perpetually awake.
 */
const SLEEP_VELOCITY_THRESHOLD = 0.001; // m/s

/** Number of sub-steps per step() call. Improves stability at larger dt. */
const SUB_STEPS = 4;

// ── Internal body representation ──────────────────────────────────────────────

/** Mutable internal state for a single simulated body. */
interface MinimalBody {
  id: string;
  bodyType: "static" | "kinematic" | "dynamic";
  /** World-space center position in meters. */
  position: { x: number; y: number; z: number };
  /** Linear velocity in m/s. Only used for dynamic bodies. */
  velocity: { x: number; y: number; z: number };
  /** Half-extents of the AABB in meters (= dimensions / 2). */
  halfExtents: { x: number; y: number; z: number };
  massKg: number;
  friction: number;
  restitution: number;
}

// ── Adapter implementation ────────────────────────────────────────────────────

/**
 * Pure-JavaScript minimal physics adapter.
 *
 * Suitable for deterministic unit tests that need to observe falling behavior
 * and AABB contact resolution without loading WebAssembly.
 *
 * Limitations:
 * - Rotation is not simulated; all bodies remain axis-aligned.
 * - Cylinder and convex-hull colliders are approximated as boxes.
 * - Dynamic vs. dynamic contact is not resolved (only dynamic vs. static).
 * - No joints, constraints, or character controller.
 *
 * These limitations are acceptable for the prototype determinism test;
 * use RapierPhysicsAdapter for production browser simulation.
 */
export class MinimalPhysicsAdapter implements PhysicsAdapter {
  private readonly bodies: Map<string, MinimalBody> = new Map();

  // init() is a no-op for the pure-JS engine.
  async init(): Promise<void> {}

  addBody(def: PhysicsBodyDef): void {
    if (def.colliderType === "none") return;

    this.bodies.set(def.id, {
      id: def.id,
      bodyType: def.bodyType,
      position: { ...def.position },
      velocity: { x: 0, y: 0, z: 0 },
      halfExtents: {
        x: def.dimensions.width / 2,
        y: def.dimensions.height / 2,
        z: def.dimensions.depth / 2,
      },
      massKg: def.massKg ?? 1.0,
      friction: def.friction ?? 0.5,
      restitution: def.restitution ?? 0.0,
    });
  }

  removeBody(id: string): void {
    this.bodies.delete(id);
  }

  /**
   * Advance the simulation by `deltaSeconds`.
   * Internally sub-stepped by SUB_STEPS for numerical stability.
   */
  step(deltaSeconds: number): void {
    const subDt = deltaSeconds / SUB_STEPS;
    for (let s = 0; s < SUB_STEPS; s++) {
      this._substep(subDt);
    }
  }

  getTransforms(): PhysicsTransform[] {
    return [...this.bodies.values()].map(toTransform);
  }

  getTransform(id: string): PhysicsTransform | undefined {
    const body = this.bodies.get(id);
    return body ? toTransform(body) : undefined;
  }

  reset(): void {
    this.bodies.clear();
  }

  // ── Internal simulation step ───────────────────────────────────────────────

  private _substep(dt: number): void {
    const allBodies = [...this.bodies.values()];
    const dynamicBodies = allBodies.filter((b) => b.bodyType === "dynamic");
    const fixedBodies = allBodies.filter((b) => b.bodyType !== "dynamic");

    for (const body of dynamicBodies) {
      // 1. Apply gravity (semi-implicit Euler: update velocity before position).
      body.velocity.y += GRAVITY_Y * dt;

      // 2. Integrate position.
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.position.z += body.velocity.z * dt;

      // 3. Resolve contacts against all static/kinematic bodies.
      for (const fixed of fixedBodies) {
        resolveContact(body, fixed);
      }

      // 4. Sleep: zero velocities below threshold.
      sleepIfNeeded(body);
    }
  }
}

// ── Contact resolution ────────────────────────────────────────────────────────

/**
 * Resolve the contact between a dynamic body and a static/kinematic body
 * using the Minimum Translating Vector (MTV) on the axis of least penetration.
 *
 * Modifies `dynamic` in place. Does not modify `fixed`.
 * No-op when the two AABBs are not overlapping.
 */
function resolveContact(dynamic: MinimalBody, fixed: MinimalBody): void {
  const ox = overlapOnAxis(
    dynamic.position.x,
    dynamic.halfExtents.x,
    fixed.position.x,
    fixed.halfExtents.x,
  );
  const oy = overlapOnAxis(
    dynamic.position.y,
    dynamic.halfExtents.y,
    fixed.position.y,
    fixed.halfExtents.y,
  );
  const oz = overlapOnAxis(
    dynamic.position.z,
    dynamic.halfExtents.z,
    fixed.position.z,
    fixed.halfExtents.z,
  );

  // Separating axis theorem: if any axis has no overlap, no contact.
  if (ox <= 0 || oy <= 0 || oz <= 0) return;

  // Resolve on the axis of least penetration (MTV).
  if (oy <= ox && oy <= oz) {
    // Y axis (most common: falling onto or hitting a ceiling)
    resolveAxisY(dynamic, fixed, oy);
  } else if (ox <= oy && ox <= oz) {
    // X axis
    resolveAxisLinear(dynamic, "x", fixed.position.x, ox, dynamic.velocity.x);
  } else {
    // Z axis
    resolveAxisLinear(dynamic, "z", fixed.position.z, oz, dynamic.velocity.z);
  }
}

/**
 * Resolve penetration and velocity on the Y axis.
 * Applies a friction impulse on the tangential (X, Z) velocity when landing.
 */
function resolveAxisY(dynamic: MinimalBody, fixed: MinimalBody, overlap: number): void {
  // Push the dynamic body away from the fixed body's center.
  const sign = dynamic.position.y >= fixed.position.y ? 1 : -1;
  dynamic.position.y += sign * overlap;

  // Velocity response: only when moving toward the fixed body.
  const approachVel = dynamic.velocity.y * -sign; // positive when approaching
  if (approachVel > 0) {
    // Reflect and dampen.
    dynamic.velocity.y = sign * approachVel * dynamic.restitution;
    if (Math.abs(dynamic.velocity.y) < SLEEP_VELOCITY_THRESHOLD) {
      dynamic.velocity.y = 0;
    }
    // Apply Coulomb friction on tangential axes (simplified per-contact impulse).
    const frictionDamp = Math.max(0, 1 - dynamic.friction * 0.5);
    dynamic.velocity.x *= frictionDamp;
    dynamic.velocity.z *= frictionDamp;
  }
}

/**
 * Resolve penetration and velocity on the X or Z axis.
 */
function resolveAxisLinear(
  dynamic: MinimalBody,
  axis: "x" | "z",
  fixedCenter: number,
  overlap: number,
  approachComponent: number,
): void {
  const sign = dynamic.position[axis] >= fixedCenter ? 1 : -1;
  dynamic.position[axis] += sign * overlap;
  const approachVel = approachComponent * -sign;
  if (approachVel > 0) {
    dynamic.velocity[axis] = sign * approachVel * dynamic.restitution;
    if (Math.abs(dynamic.velocity[axis]) < SLEEP_VELOCITY_THRESHOLD) {
      dynamic.velocity[axis] = 0;
    }
  }
}

// ── Helper utilities ──────────────────────────────────────────────────────────

/**
 * Signed overlap between two 1D intervals [p1 ± h1] and [p2 ± h2].
 * Positive → overlap exists; zero or negative → separated.
 */
function overlapOnAxis(p1: number, h1: number, p2: number, h2: number): number {
  return h1 + h2 - Math.abs(p1 - p2);
}

/** Zero velocity components that are below the sleep threshold. */
function sleepIfNeeded(body: MinimalBody): void {
  if (Math.abs(body.velocity.x) < SLEEP_VELOCITY_THRESHOLD) body.velocity.x = 0;
  if (Math.abs(body.velocity.y) < SLEEP_VELOCITY_THRESHOLD) body.velocity.y = 0;
  if (Math.abs(body.velocity.z) < SLEEP_VELOCITY_THRESHOLD) body.velocity.z = 0;
}

/** Serialize a body's current pose to a plain PhysicsTransform. */
function toTransform(body: MinimalBody): PhysicsTransform {
  return {
    id: body.id,
    position: { ...body.position },
    rotation: { x: 0, y: 0, z: 0 }, // rotation not simulated
  };
}
