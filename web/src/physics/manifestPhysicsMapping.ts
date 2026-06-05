// manifestPhysicsMapping.ts
// Convert officeAssetManifest entries to PhysicsBodyDef objects.
//
// This module is the bridge between the static manifest metadata
// (OfficeAssetEntry) and the physics adapter input (PhysicsBodyDef).
//
// Key conversion:
//   The manifest uses BOTTOM-based Y convention:
//     position.y = the floor-level Y of the object.
//   Physics engines (Rapier, MinimalPhysicsAdapter) use CENTER-based Y:
//     position.y = the centroid of the bounding volume.
//
//   Conversion: center_y = bottom_y + dimensions.height / 2
//
//   This conversion happens only here; the manifest, session types, and
//   placement helpers are unaffected.
//
// Design constraints:
//   - No Three.js imports.
//   - All returned values are plain serializable JSON.
//   - Pure functions — no side effects, no state.
//
// See plans/browser-runtime-physics-plan.md § Manifest mapping.

import type { SceneObjectState } from "../state/sessionTypes";
import type { OfficeAssetEntry } from "../assets/officeAssetManifest";
import { getAssetById } from "../assets/officeAssetManifest";
import type { PhysicsBodyDef } from "./physicsAdapter";

// ── Single-entry conversion ───────────────────────────────────────────────────

/**
 * Convert one manifest entry + current scene object position to a
 * `PhysicsBodyDef` suitable for `PhysicsAdapter.addBody()`.
 *
 * The SceneObjectState `position` overrides the manifest `defaultTransform`
 * when present (the object may have been moved at runtime).
 *
 * Returns `undefined` when the entry's `colliderType` is "none" — such
 * objects should not be added to the simulation.
 *
 * Pure function — no side effects.
 */
export function sceneObjectToPhysicsBodyDef(
  obj: SceneObjectState,
  entry: OfficeAssetEntry,
): PhysicsBodyDef | undefined {
  // Objects with colliderType "none" have no physics representation.
  if (entry.colliderType === "none") return undefined;

  // Resolve position: runtime SceneObjectState overrides manifest default.
  const manifestDefault = entry.defaultTransform.position;
  const bottomX = obj.position?.x ?? manifestDefault.x;
  const bottomY = obj.position?.y ?? manifestDefault.y;
  const bottomZ = obj.position?.z ?? manifestDefault.z;

  // Convert bottom-based Y → center-based Y (physics engine convention).
  const centerY = bottomY + entry.dimensions.height / 2;

  return {
    id: obj.id,
    bodyType: entry.bodyType,
    colliderType: entry.colliderType,
    position: { x: bottomX, y: centerY, z: bottomZ },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: {
      width: entry.dimensions.width,
      height: entry.dimensions.height,
      depth: entry.dimensions.depth,
    },
    ...(entry.massKg !== undefined ? { massKg: entry.massKg } : {}),
    ...(entry.friction !== undefined ? { friction: entry.friction } : {}),
    ...(entry.restitution !== undefined ? { restitution: entry.restitution } : {}),
  };
}

// ── Batch conversion ──────────────────────────────────────────────────────────

/**
 * Convert an array of SceneObjectState objects to PhysicsBodyDef objects,
 * resolving each against the asset manifest.
 *
 * Objects are silently skipped when:
 * - They have no `assetId`.
 * - Their `assetId` is not found in the manifest.
 * - Their manifest entry has `colliderType === "none"`.
 * - They are disabled (`enabled === false`).
 *
 * Pure function — no side effects.
 */
export function sceneObjectsToPhysicsBodyDefs(
  objects: SceneObjectState[],
): PhysicsBodyDef[] {
  const result: PhysicsBodyDef[] = [];
  for (const obj of objects) {
    // Disabled objects are not added to the simulation.
    if (!obj.enabled) continue;
    if (!obj.assetId) continue;

    const entry = getAssetById(obj.assetId);
    if (!entry) continue;

    const def = sceneObjectToPhysicsBodyDef(obj, entry);
    if (def) result.push(def);
  }
  return result;
}

// ── Center → bottom-Y conversion (inverse) ───────────────────────────────────

/**
 * Convert a physics transform (center-based Y) back to a session-state
 * position (bottom-based Y) for writing results back to SceneObjectState.
 *
 * `heightM` is the full height of the object in meters (from the manifest).
 *
 * Pure function — no side effects.
 */
export function physicsTransformToSessionPosition(
  centerPosition: { x: number; y: number; z: number },
  heightM: number,
): { x: number; y: number; z: number } {
  return {
    x: centerPosition.x,
    y: centerPosition.y - heightM / 2,
    z: centerPosition.z,
  };
}
