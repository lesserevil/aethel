// physicsAdapter.ts
// Narrow adapter interface for browser-side physics simulation.
//
// Design constraints:
//   - No Three.js imports or objects.
//   - All in/out types are plain serializable JSON values — safe to store
//     in session state or send over a wire.
//   - Async init() isolates WASM loading from the synchronous step loop.
//   - Position convention: world-space CENTER in meters.
//     The manifest uses bottom-based Y; use manifestPhysicsMapping.ts to
//     convert before calling addBody().
//   - The interface is intentionally narrow so multiple backends can
//     implement it: RapierPhysicsAdapter (browser WASM),
//     MinimalPhysicsAdapter (pure-JS test engine), or a future stub.
//
// See plans/browser-runtime-physics-plan.md § Architecture.

import type { BodyType, ColliderType } from "../state/sessionTypes";

// ── Input types ───────────────────────────────────────────────────────────────

/**
 * Input definition for a single physics body.
 * All numeric fields are in SI units (meters, kilograms).
 */
export interface PhysicsBodyDef {
  /**
   * Stable identifier that matches the SceneObjectState `id`.
   * Used to correlate getTransform() results back to session state.
   */
  id: string;
  /**
   * Body simulation mode.
   * - "static"    Fixed in place; other bodies collide with it.
   * - "kinematic" Can be moved by the caller each step; not driven by forces.
   * - "dynamic"   Fully simulated; affected by gravity, forces, contacts.
   */
  bodyType: BodyType;
  /**
   * Collision shape.
   * - "box"         Axis-aligned box (most common; low cost).
   * - "cylinder"    Upright cylinder (cups, cans, trash bins).
   * - "convexHull"  Convex approximation (lamps, complex static props).
   * - "trimesh"     Full triangle mesh (expensive; avoid by default).
   * - "none"        No collider — body not added to simulation.
   */
  colliderType: ColliderType;
  /** World-space CENTER position in meters. */
  position: { x: number; y: number; z: number };
  /** Euler rotation in degrees (pitch/yaw/roll about X/Y/Z). */
  rotation: { x: number; y: number; z: number };
  /** Full bounding dimensions in meters: width × height × depth. */
  dimensions: { width: number; height: number; depth: number };
  /**
   * Mass in kilograms. Required for dynamic bodies; ignored by the engine
   * for static and kinematic bodies.
   */
  massKg?: number;
  /**
   * Coulomb friction coefficient (0 = frictionless, 1 = high friction).
   * Defaults to 0.5 when omitted.
   */
  friction?: number;
  /**
   * Coefficient of restitution, i.e. bounciness
   * (0 = perfectly inelastic, 1 = perfectly elastic).
   * Defaults to 0.0 when omitted.
   */
  restitution?: number;
}

// ── Output types ──────────────────────────────────────────────────────────────

/**
 * Post-simulation transform for one physics body.
 * Plain serializable object — safe to store in session state.
 */
export interface PhysicsTransform {
  /** Matches the id from the originating PhysicsBodyDef. */
  id: string;
  /** World-space CENTER position in meters after simulation. */
  position: { x: number; y: number; z: number };
  /** Euler rotation in degrees after simulation. */
  rotation: { x: number; y: number; z: number };
}

// ── Adapter interface ─────────────────────────────────────────────────────────

/**
 * Narrow adapter interface for browser-side physics simulation.
 *
 * ## Lifecycle
 *
 * ```
 * const adapter: PhysicsAdapter = new RapierPhysicsAdapter(); // or Minimal
 * await adapter.init();                    // async: loads WASM or no-op
 *
 * adapter.addBody(deskDef);                // static floor / furniture
 * adapter.addBody(coffeeCupDef);           // dynamic prop
 *
 * for each frame:
 *   adapter.step(deltaSeconds);            // advance simulation
 *   const t = adapter.getTransform("cup"); // read results
 *   // write t.position back to session state
 *
 * adapter.reset();                         // clear scene on session reset
 * ```
 *
 * ## Constraints
 *
 * - `step()` is **synchronous**. The only async boundary is `init()`.
 * - All results are plain JSON — no Three.js objects, no WASM handles.
 * - Calling `step()` before `init()` resolves is undefined behaviour;
 *   implementations may throw.
 * - `deltaSeconds` should not exceed ~0.1 s per call; large time steps
 *   can cause numerical instability in all physics engines.
 *
 * ## GPU requirements
 *
 * Neither `RapierPhysicsAdapter` nor `MinimalPhysicsAdapter` requires a GPU.
 * Rapier uses WebAssembly and runs entirely on the CPU.
 */
export interface PhysicsAdapter {
  /**
   * Initialize the physics engine.
   * Resolves when the engine is ready to accept `addBody()` calls.
   * For Rapier, this awaits WASM module loading (inlined base64 — no fetch).
   * For MinimalPhysicsAdapter, this is a no-op returning immediately.
   */
  init(): Promise<void>;

  /**
   * Add a body to the simulation.
   * If a body with the same `id` already exists it is replaced.
   * Bodies with `colliderType === "none"` are silently ignored.
   */
  addBody(def: PhysicsBodyDef): void;

  /**
   * Remove a body from the simulation by id.
   * No-op if the id is not present.
   */
  removeBody(id: string): void;

  /**
   * Advance the simulation by `deltaSeconds`.
   * Typical values: 1/60 (60 Hz), 1/120 (120 Hz).
   * Do not pass more than ~0.1 s to avoid instability.
   */
  step(deltaSeconds: number): void;

  /**
   * Return current transforms for every body in the simulation,
   * including static bodies (their transform never changes).
   */
  getTransforms(): PhysicsTransform[];

  /**
   * Return the current transform for one body, or `undefined` when
   * no body with that id is registered.
   */
  getTransform(id: string): PhysicsTransform | undefined;

  /**
   * Remove all bodies and reset the world to its empty initial state.
   * Call this when the session resets or when the office scene is reloaded.
   */
  reset(): void;
}
