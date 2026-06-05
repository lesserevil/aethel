// placementHelpers.ts
// Lightweight collider-aware placement helpers for the Aethel MVP.
//
// NO physics engine — pure AABB (axis-aligned bounding box) math on
// manifest-backed dimensions. All positions are in world-space meters,
// matching Three.js coordinates.
//
// Design constraints:
//   - No Three.js imports or objects.
//   - No runtime physics objects.
//   - All functions are pure (no side effects, no state mutations).
//   - Every function is independently unit-testable with plain JS values.

import type { SceneObjectState } from "../state/sessionTypes";
import { getAssetById } from "../assets/officeAssetManifest";

// ── AABB type ─────────────────────────────────────────────────────────────────

/**
 * Axis-aligned bounding box in world space, in meters.
 * All six face planes are represented as min/max on each axis.
 */
export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// ── AABB construction ─────────────────────────────────────────────────────────

/**
 * Build an AABB from a world-space position and object dimensions.
 *
 * Convention: `position.y` is the bottom (base) of the object — the Y
 * coordinate where the object sits on the floor or a surface. The box
 * extends upward from `position.y` by `dimensions.height`.
 *
 * X and Z are centered on `position.x` / `position.z`.
 *
 * Pure function — no side effects.
 */
export function buildAABB(
  position: { x: number; y: number; z: number },
  dimensions: { width: number; height: number; depth: number },
): AABB {
  const halfW = dimensions.width / 2;
  const halfD = dimensions.depth / 2;
  return {
    minX: position.x - halfW,
    maxX: position.x + halfW,
    minY: position.y,
    maxY: position.y + dimensions.height,
    minZ: position.z - halfD,
    maxZ: position.z + halfD,
  };
}

// ── Overlap test ──────────────────────────────────────────────────────────────

/**
 * Returns true when two AABBs overlap (including shared edges/faces).
 *
 * Uses the separating axis theorem on three axes.
 * Pure function — no side effects.
 */
export function aabbsOverlap(a: AABB, b: AABB): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}

// ── Dimension resolution ──────────────────────────────────────────────────────

/**
 * Resolve the bounding dimensions for a scene object.
 *
 * Uses the asset manifest entry when `obj.assetId` is present; falls back
 * to a 0.3 × 0.3 × 0.3 m unit cube for objects without an assetId or with
 * an assetId that is not in the manifest.
 *
 * Pure function — no side effects.
 */
export function resolveObjectDimensions(obj: SceneObjectState): {
  width: number;
  height: number;
  depth: number;
} {
  if (obj.assetId) {
    const entry = getAssetById(obj.assetId);
    if (entry) {
      return {
        width: entry.dimensions.width,
        height: entry.dimensions.height,
        depth: entry.dimensions.depth,
      };
    }
  }
  // Default fallback: 0.3 m unit cube
  return { width: 0.3, height: 0.3, depth: 0.3 };
}

/**
 * Build the world-space AABB for a scene object using its current position
 * and manifest-derived (or fallback) dimensions.
 *
 * Returns `undefined` if the object has no `position` field (cannot determine
 * placement without knowing where the object is).
 *
 * Pure function — no side effects.
 */
export function getObjectAABB(obj: SceneObjectState): AABB | undefined {
  if (!obj.position) return undefined;
  const dims = resolveObjectDimensions(obj);
  return buildAABB(obj.position, dims);
}

// ── Affordance helpers ────────────────────────────────────────────────────────

/**
 * Returns true when the given scene object has the "work-surface" affordance,
 * checking the object's own `affordances` override first, then the asset
 * manifest entry.
 *
 * Pure function — no side effects.
 */
export function isWorkSurface(obj: SceneObjectState): boolean {
  if (obj.affordances?.includes("work-surface")) return true;
  if (obj.assetId) {
    const entry = getAssetById(obj.assetId);
    if (entry?.affordances.includes("work-surface")) return true;
  }
  return false;
}

/**
 * Returns true when the given scene object has the "pickup" affordance,
 * meaning it can be freely repositioned during the interaction prototype.
 *
 * Checks the object's own `affordances` override first, then the manifest.
 *
 * Pure function — no side effects.
 */
export function isPickupObject(obj: SceneObjectState): boolean {
  if (obj.affordances?.includes("pickup")) return true;
  if (obj.assetId) {
    const entry = getAssetById(obj.assetId);
    if (entry?.affordances.includes("pickup")) return true;
  }
  return false;
}

// ── Surface top-Y calculation ─────────────────────────────────────────────────

/**
 * Calculate the top-surface Y coordinate of a scene object.
 *
 * This is the Y level where another object's base should sit to rest on top.
 * Returns `undefined` if the object has no position.
 *
 * Pure function — no side effects.
 */
export function getSurfaceTopY(surface: SceneObjectState): number | undefined {
  if (!surface.position) return undefined;
  const dims = resolveObjectDimensions(surface);
  return surface.position.y + dims.height;
}

// ── Placement result ──────────────────────────────────────────────────────────

/** Result returned by placement validation helpers. */
export interface PlacementResult {
  /** Whether the proposed placement is valid (no conflicts). */
  valid: boolean;
  /**
   * Human-readable reason for rejection (only present when `valid === false`).
   * Suitable for displaying in the UI or logging.
   */
  reason?: string;
  /**
   * Validated world-space snap position (only present when `valid === true`).
   * The caller should use this position to update the object in session state.
   */
  snapPosition?: { x: number; y: number; z: number };
}

// ── Overlap validation ────────────────────────────────────────────────────────

/**
 * Validate whether `movingObj` can be placed at `targetPosition` without
 * overlapping any of the `otherObjects`.
 *
 * An overlap is detected when two AABBs intersect by more than
 * `overlapToleranceM` meters on every axis simultaneously. The default
 * tolerance of 10 mm avoids false positives from floating-point rounding.
 *
 * Returns `PlacementResult` with:
 *   - `valid: true` and `snapPosition` when no conflict is found.
 *   - `valid: false` and `reason` naming the conflicting object.
 *
 * Pure function — no side effects.
 */
export function validatePlacement(
  movingObj: SceneObjectState,
  targetPosition: { x: number; y: number; z: number },
  otherObjects: SceneObjectState[],
  overlapToleranceM = 0.01,
): PlacementResult {
  const dims = resolveObjectDimensions(movingObj);
  const proposed = buildAABB(targetPosition, dims);

  // Shrink the proposed box inward by the tolerance before testing overlap.
  // This lets two objects share a surface without triggering a false positive.
  const shrunk: AABB = {
    minX: proposed.minX + overlapToleranceM,
    maxX: proposed.maxX - overlapToleranceM,
    minY: proposed.minY + overlapToleranceM,
    maxY: proposed.maxY - overlapToleranceM,
    minZ: proposed.minZ + overlapToleranceM,
    maxZ: proposed.maxZ - overlapToleranceM,
  };

  for (const other of otherObjects) {
    if (other.id === movingObj.id) continue; // skip self
    if (!other.enabled) continue; // skip disabled objects
    const otherAABB = getObjectAABB(other);
    if (!otherAABB) continue; // skip objects with no position

    if (aabbsOverlap(shrunk, otherAABB)) {
      return {
        valid: false,
        reason: `Placement would overlap with "${other.label ?? other.id}"`,
      };
    }
  }

  return { valid: true, snapPosition: targetPosition };
}

// ── Snap-to-surface ───────────────────────────────────────────────────────────

/**
 * Calculate the snap position for placing `movingObj` on the center of `surface`.
 *
 * X and Z are set to the surface's center position.
 * Y is set to the surface's top face so the moving object rests on it.
 *
 * Returns `undefined` when the surface has no position.
 *
 * Pure function — no side effects.
 */
export function calculateSnapPosition(
  surface: SceneObjectState,
  movingObjDims: { width: number; height: number; depth: number },
): { x: number; y: number; z: number } | undefined {
  if (!surface.position) return undefined;
  void movingObjDims; // dimensions of the moving object are not needed for center-snap
  const topY = getSurfaceTopY(surface);
  if (topY === undefined) return undefined;
  return {
    x: surface.position.x,
    y: topY,
    z: surface.position.z,
  };
}

/**
 * Attempt to snap `movingObj` onto the center of `surface`, checking that
 * the snap position does not overlap any other enabled objects.
 *
 * This is the primary entry point for the "place on work surface" interaction:
 * 1. Validates that `surface` has the "work-surface" affordance.
 * 2. Calculates the center-snap position on top of the surface.
 * 3. Checks the snap position against all other enabled objects.
 *
 * Returns a `PlacementResult`. On success, `snapPosition` carries the
 * validated world-space position ready to dispatch to session state. On
 * failure, `reason` describes what blocked the placement.
 *
 * Pure function — no side effects.
 */
export function snapToWorkSurface(
  movingObj: SceneObjectState,
  surface: SceneObjectState,
  allObjects: SceneObjectState[],
): PlacementResult {
  // Guard: surface must have the work-surface affordance
  if (!isWorkSurface(surface)) {
    return {
      valid: false,
      reason: `"${surface.label ?? surface.id}" is not a work surface`,
    };
  }

  // Guard: surface must have position data
  const movingDims = resolveObjectDimensions(movingObj);
  const snapPos = calculateSnapPosition(surface, movingDims);
  if (!snapPos) {
    return { valid: false, reason: "Work surface has no position data" };
  }

  // Validate against every object except the surface and the moving object itself
  const otherObjects = allObjects.filter(
    (o) => o.id !== surface.id && o.id !== movingObj.id,
  );

  return validatePlacement(movingObj, snapPos, otherObjects);
}
