// rapierPhysicsAdapter.ts
// Rapier 3D WASM adapter implementing the PhysicsAdapter interface.
//
// Uses @dimforge/rapier3d-compat (Apache 2.0), which ships the Rapier WASM
// binary inlined as base64 — no external fetch, no CDN, no GPU required.
//
// GPU requirements: NONE. Rapier runs entirely on the CPU via WebAssembly.
// Works in modern browsers and in Node.js (the -compat package handles
// both environments).
//
// Position convention: CENTER-based in meters. Matches PhysicsBodyDef.
//
// Collider mapping:
//   "box"        → Rapier cuboid (half-extents)
//   "cylinder"   → Rapier cylinder (half-height, radius from max(w,d)/2)
//   "convexHull" → Rapier cuboid approximation (convex hull from vertex set
//                  is deferred to a future task when USD meshes are available)
//   "trimesh"    → Rapier cuboid approximation (same deferral)
//   "none"       → body not added to simulation
//
// See plans/browser-runtime-physics-plan.md § Architecture.

import type { PhysicsAdapter, PhysicsBodyDef, PhysicsTransform } from "./physicsAdapter";
import type RAPIER_TYPE from "@dimforge/rapier3d-compat";

// ── Internal handle ───────────────────────────────────────────────────────────

/** Maps the logical body id to the Rapier rigid-body handle. */
type BodyHandle = number;

// ── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Production browser physics adapter backed by Rapier 3D WASM.
 *
 * ## Usage
 *
 * ```ts
 * import { RapierPhysicsAdapter } from "./rapierPhysicsAdapter";
 * import { sceneObjectsToPhysicsBodyDefs } from "./manifestPhysicsMapping";
 *
 * const physics = new RapierPhysicsAdapter();
 * await physics.init();                                  // load WASM once
 *
 * const defs = sceneObjectsToPhysicsBodyDefs(scene.objects);
 * defs.forEach(def => physics.addBody(def));
 *
 * // Game/render loop
 * function onFrame(dt: number) {
 *   physics.step(dt);
 *   const transforms = physics.getTransforms();
 *   // Write transforms back to session state via reducer dispatch
 * }
 * ```
 */
export class RapierPhysicsAdapter implements PhysicsAdapter {
  private rapier: typeof RAPIER_TYPE | null = null;
  private world: InstanceType<typeof RAPIER_TYPE.World> | null = null;
  /** id → Rapier rigid-body handle */
  private handleMap: Map<string, BodyHandle> = new Map();
  /** id → original PhysicsBodyDef (needed for getTransforms on static bodies) */
  private defMap: Map<string, PhysicsBodyDef> = new Map();

  /**
   * Initialize Rapier WASM.
   * Safe to call multiple times; subsequent calls are no-ops.
   */
  async init(): Promise<void> {
    if (this.rapier !== null) return;

    // Dynamic import so the WASM module is only loaded on demand.
    const RAPIER = await import("@dimforge/rapier3d-compat");
    await RAPIER.init();
    this.rapier = RAPIER;

    // Create the world with standard Earth gravity.
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  }

  addBody(def: PhysicsBodyDef): void {
    this._assertReady();
    if (def.colliderType === "none") return;

    const RAPIER = this.rapier!;
    const world = this.world!;

    // Remove existing body with the same id.
    this.removeBody(def.id);

    // Rigid body descriptor
    let rbDesc: ReturnType<(typeof RAPIER)["RigidBodyDesc"]["fixed"]>;
    switch (def.bodyType) {
      case "static":
        rbDesc = RAPIER.RigidBodyDesc.fixed();
        break;
      case "kinematic":
        rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
      case "dynamic":
        rbDesc = RAPIER.RigidBodyDesc.dynamic();
        if (def.massKg !== undefined) {
          // additionalMass is set via the collider; the body is left massless
          // and the collider's density drives the mass.
        }
        break;
      default:
        rbDesc = RAPIER.RigidBodyDesc.fixed();
    }

    rbDesc.setTranslation(def.position.x, def.position.y, def.position.z);

    const rigidBody = world.createRigidBody(rbDesc);

    // Collider descriptor
    const hw = def.dimensions.width / 2;
    const hh = def.dimensions.height / 2;
    const hd = def.dimensions.depth / 2;

    let colliderDesc: ReturnType<(typeof RAPIER)["ColliderDesc"]["cuboid"]>;
    switch (def.colliderType) {
      case "box":
        colliderDesc = RAPIER.ColliderDesc.cuboid(hw, hh, hd);
        break;
      case "cylinder": {
        // Rapier cylinder: (half_height, radius)
        // Radius from the larger of width/depth half-extents.
        const radius = Math.max(hw, hd);
        colliderDesc = RAPIER.ColliderDesc.cylinder(hh, radius);
        break;
      }
      case "convexHull":
      case "trimesh":
        // Approximate with a box until USD mesh data is available.
        colliderDesc = RAPIER.ColliderDesc.cuboid(hw, hh, hd);
        break;
      default:
        colliderDesc = RAPIER.ColliderDesc.cuboid(hw, hh, hd);
    }

    // Apply material properties.
    if (def.friction !== undefined) colliderDesc.setFriction(def.friction);
    if (def.restitution !== undefined) colliderDesc.setRestitution(def.restitution);

    // Set mass via density for dynamic bodies.
    if (def.bodyType === "dynamic" && def.massKg !== undefined) {
      const volume = def.dimensions.width * def.dimensions.height * def.dimensions.depth;
      const density = volume > 0 ? def.massKg / volume : 1.0;
      colliderDesc.setDensity(density);
    }

    world.createCollider(colliderDesc, rigidBody);

    this.handleMap.set(def.id, rigidBody.handle);
    this.defMap.set(def.id, def);
  }

  removeBody(id: string): void {
    this._assertReady();
    const handle = this.handleMap.get(id);
    if (handle === undefined) return;

    const world = this.world!;
    const body = world.getRigidBody(handle);
    if (body) world.removeRigidBody(body);

    this.handleMap.delete(id);
    this.defMap.delete(id);
  }

  step(deltaSeconds: number): void {
    this._assertReady();
    // Rapier uses a fixed timestep internally; we set dt before stepping.
    this.world!.timestep = deltaSeconds;
    this.world!.step();
  }

  getTransforms(): PhysicsTransform[] {
    this._assertReady();
    const transforms: PhysicsTransform[] = [];
    for (const [id, handle] of this.handleMap) {
      const t = this._transformFromHandle(id, handle);
      if (t) transforms.push(t);
    }
    return transforms;
  }

  getTransform(id: string): PhysicsTransform | undefined {
    this._assertReady();
    const handle = this.handleMap.get(id);
    if (handle === undefined) return undefined;
    return this._transformFromHandle(id, handle) ?? undefined;
  }

  reset(): void {
    if (this.rapier === null) return; // Not yet initialized — nothing to clear.
    const RAPIER = this.rapier;
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.handleMap.clear();
    this.defMap.clear();
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _assertReady(): void {
    if (this.rapier === null || this.world === null) {
      throw new Error(
        "RapierPhysicsAdapter: init() must be awaited before using the adapter.",
      );
    }
  }

  private _transformFromHandle(id: string, handle: BodyHandle): PhysicsTransform | null {
    const world = this.world!;
    const body = world.getRigidBody(handle);
    if (!body) return null;

    const t = body.translation();
    const r = body.rotation(); // quaternion

    // Convert quaternion to Euler angles (degrees) — simplified, Y-up only.
    // Full quaternion→Euler conversion is deferred; rotations are minimal in
    // the current prototype.
    const pitch = Math.atan2(
      2 * (r.w * r.x + r.y * r.z),
      1 - 2 * (r.x * r.x + r.y * r.y),
    );
    const yaw = Math.asin(2 * (r.w * r.y - r.z * r.x));
    const roll = Math.atan2(2 * (r.w * r.z + r.x * r.y), 1 - 2 * (r.y * r.y + r.z * r.z));

    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    return {
      id,
      position: { x: t.x, y: t.y, z: t.z },
      rotation: { x: toDeg(pitch), y: toDeg(yaw), z: toDeg(roll) },
    };
  }
}
