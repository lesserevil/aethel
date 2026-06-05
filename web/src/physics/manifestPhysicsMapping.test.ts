// manifestPhysicsMapping.test.ts
// Unit tests for manifestPhysicsMapping.ts
//
// Verifies:
//  - sceneObjectToPhysicsBodyDef: bottom-Y → center-Y conversion,
//    correct field mapping for body type and collider type, optional
//    physics fields (mass, friction, restitution).
//  - sceneObjectsToPhysicsBodyDefs: batch conversion, disabled object skip,
//    unknown asset skip, collider-none skip.
//  - physicsTransformToSessionPosition: inverse center → bottom conversion.
//
// All tests use plain JS values — no Three.js, no React, no browser APIs.

import { describe, it, expect } from "vitest";
import {
  sceneObjectToPhysicsBodyDef,
  sceneObjectsToPhysicsBodyDefs,
  physicsTransformToSessionPosition,
} from "./manifestPhysicsMapping";
import { getAssetById, OFFICE_ASSET_MANIFEST } from "../assets/officeAssetManifest";
import type { SceneObjectState } from "../state/sessionTypes";
import type { OfficeAssetEntry } from "../assets/officeAssetManifest";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Office desk scene object — static, box collider. */
const deskObj: SceneObjectState = {
  id: "obj-desk",
  label: "Desk",
  type: "desk",
  enabled: true,
  assetId: "office-desk",
  position: { x: 0, y: 0, z: 0 },
};

/** Coffee cup scene object — dynamic, cylinder collider, has mass/friction/restitution. */
const cupObj: SceneObjectState = {
  id: "obj-cup",
  label: "Cup",
  type: "cup",
  enabled: true,
  assetId: "office-coffee-cup",
  position: { x: -0.4, y: 0.76, z: 0.2 },
};

/** Laptop — dynamic, box collider, has mass + friction. */
const laptopObj: SceneObjectState = {
  id: "obj-laptop",
  label: "Laptop",
  type: "laptop",
  enabled: true,
  assetId: "office-laptop",
  position: { x: -0.3, y: 0.76, z: 0.05 },
};

/** A disabled object — should be excluded from batch conversion. */
const disabledChair: SceneObjectState = {
  id: "obj-chair",
  label: "Chair",
  type: "chair",
  enabled: false,
  assetId: "office-chair",
  position: { x: 0, y: 0, z: 0.9 },
};

/** An object with no assetId — should be excluded from batch conversion. */
const noAssetObj: SceneObjectState = {
  id: "obj-unknown",
  label: "Unknown",
  type: "mystery",
  enabled: true,
  // no assetId
};

// ── sceneObjectToPhysicsBodyDef ───────────────────────────────────────────────

describe("sceneObjectToPhysicsBodyDef", () => {
  it("converts desk (static, box) correctly", () => {
    const entry = getAssetById("office-desk")!;
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry);

    expect(def).toBeDefined();
    expect(def!.id).toBe("obj-desk");
    expect(def!.bodyType).toBe("static");
    expect(def!.colliderType).toBe("box");
  });

  it("converts bottom-based Y to center-based Y for the desk", () => {
    // desk: position.y=0 (bottom), height=0.75, so center_y=0.375
    const entry = getAssetById("office-desk")!;
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry)!;

    expect(def.position.y).toBeCloseTo(0.75 / 2, 5); // 0.375
  });

  it("preserves X and Z positions unchanged", () => {
    const entry = getAssetById("office-desk")!;
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry)!;

    expect(def.position.x).toBeCloseTo(0);
    expect(def.position.z).toBeCloseTo(0);
  });

  it("converts coffee cup (dynamic, cylinder) with mass/friction/restitution", () => {
    // cup: bottom Y=0.76, height=0.1, center_y=0.76+0.05=0.81
    const entry = getAssetById("office-coffee-cup")!;
    const def = sceneObjectToPhysicsBodyDef(cupObj, entry)!;

    expect(def).toBeDefined();
    expect(def.id).toBe("obj-cup");
    expect(def.bodyType).toBe("dynamic");
    expect(def.colliderType).toBe("cylinder");
    expect(def.position.y).toBeCloseTo(0.76 + 0.1 / 2, 5); // 0.81
    expect(def.massKg).toBe(0.3);
    expect(def.friction).toBe(0.4);
    expect(def.restitution).toBe(0.1);
  });

  it("copies dimensions from the manifest entry", () => {
    const entry = getAssetById("office-desk")!;
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry)!;

    expect(def.dimensions.width).toBeCloseTo(1.4);
    expect(def.dimensions.height).toBeCloseTo(0.75);
    expect(def.dimensions.depth).toBeCloseTo(0.7);
  });

  it("omits massKg when entry has no massKg (static body)", () => {
    const entry = getAssetById("office-desk")!;
    expect(entry.massKg).toBeUndefined();
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry)!;
    expect(def.massKg).toBeUndefined();
  });

  it("omits friction when entry has no friction", () => {
    const entry = getAssetById("office-desk")!;
    expect(entry.friction).toBeUndefined();
    const def = sceneObjectToPhysicsBodyDef(deskObj, entry)!;
    expect(def.friction).toBeUndefined();
  });

  it("includes friction when entry has friction (laptop: 0.5)", () => {
    const entry = getAssetById("office-laptop")!;
    const def = sceneObjectToPhysicsBodyDef(laptopObj, entry)!;
    expect(def.friction).toBe(0.5);
  });

  it("returns undefined when colliderType is 'none'", () => {
    const fakeNoneEntry: OfficeAssetEntry = {
      ...(getAssetById("office-desk") as OfficeAssetEntry),
      id: "fake-none",
      colliderType: "none",
    };
    const result = sceneObjectToPhysicsBodyDef(deskObj, fakeNoneEntry);
    expect(result).toBeUndefined();
  });

  it("uses session state position when present, over manifest default", () => {
    // Override position to verify runtime position is used
    const movedCup: SceneObjectState = {
      ...cupObj,
      position: { x: 1.0, y: 2.0, z: 3.0 },
    };
    const entry = getAssetById("office-coffee-cup")!;
    const def = sceneObjectToPhysicsBodyDef(movedCup, entry)!;

    expect(def.position.x).toBeCloseTo(1.0);
    // Y should be center: 2.0 + 0.1/2 = 2.05
    expect(def.position.y).toBeCloseTo(2.05, 5);
    expect(def.position.z).toBeCloseTo(3.0);
  });

  it("falls back to manifest default position when SceneObjectState has no position", () => {
    const noPosCup: SceneObjectState = {
      ...cupObj,
      position: undefined,
    };
    const entry = getAssetById("office-coffee-cup")!;
    const def = sceneObjectToPhysicsBodyDef(noPosCup, entry)!;

    // Manifest default for coffee cup: { x: -0.4, y: 0.76, z: 0.2 }
    // center_y = 0.76 + 0.1/2 = 0.81
    expect(def.position.x).toBeCloseTo(-0.4);
    expect(def.position.y).toBeCloseTo(0.81, 5);
    expect(def.position.z).toBeCloseTo(0.2);
  });
});

// ── sceneObjectsToPhysicsBodyDefs ─────────────────────────────────────────────

describe("sceneObjectsToPhysicsBodyDefs", () => {
  it("converts all enabled objects with assetIds to body defs", () => {
    const objects = [deskObj, cupObj, laptopObj];
    const defs = sceneObjectsToPhysicsBodyDefs(objects);
    expect(defs).toHaveLength(3);
    expect(defs.map((d) => d.id)).toEqual(
      expect.arrayContaining(["obj-desk", "obj-cup", "obj-laptop"]),
    );
  });

  it("excludes disabled objects", () => {
    const objects = [deskObj, disabledChair];
    const defs = sceneObjectsToPhysicsBodyDefs(objects);
    expect(defs.map((d) => d.id)).not.toContain("obj-chair");
  });

  it("excludes objects with no assetId", () => {
    const objects = [deskObj, noAssetObj];
    const defs = sceneObjectsToPhysicsBodyDefs(objects);
    expect(defs.map((d) => d.id)).not.toContain("obj-unknown");
  });

  it("excludes objects with an unknown assetId", () => {
    const unknownAsset: SceneObjectState = {
      id: "obj-ghost",
      label: "Ghost",
      type: "ghost",
      enabled: true,
      assetId: "nonexistent-id",
      position: { x: 0, y: 0, z: 0 },
    };
    const defs = sceneObjectsToPhysicsBodyDefs([unknownAsset]);
    expect(defs).toHaveLength(0);
  });

  it("returns an empty array for an empty input", () => {
    expect(sceneObjectsToPhysicsBodyDefs([])).toHaveLength(0);
  });

  it("converts all 10 manifest entries when all are enabled and present", () => {
    // Build scene objects for every manifest entry
    const sceneObjects: SceneObjectState[] = OFFICE_ASSET_MANIFEST.map((entry, idx) => ({
      id: `obj-${idx}`,
      label: entry.label,
      type: entry.category,
      enabled: true,
      assetId: entry.id,
      position: entry.defaultTransform.position,
    }));
    const defs = sceneObjectsToPhysicsBodyDefs(sceneObjects);
    // All 10 entries have a non-"none" colliderType, so all 10 should be converted.
    expect(defs).toHaveLength(OFFICE_ASSET_MANIFEST.length);
  });
});

// ── physicsTransformToSessionPosition ────────────────────────────────────────

describe("physicsTransformToSessionPosition", () => {
  it("converts center Y back to bottom Y", () => {
    // center_y=0.375, height=0.75 → bottom_y=0
    const pos = physicsTransformToSessionPosition({ x: 0, y: 0.375, z: 0 }, 0.75);
    expect(pos.y).toBeCloseTo(0);
  });

  it("passes X and Z through unchanged", () => {
    const pos = physicsTransformToSessionPosition({ x: 1.5, y: 2.0, z: -0.5 }, 1.0);
    expect(pos.x).toBeCloseTo(1.5);
    expect(pos.z).toBeCloseTo(-0.5);
  });

  it("is the inverse of the bottom→center conversion in sceneObjectToPhysicsBodyDef", () => {
    // Round-trip: bottom=0.76 → center=0.81 → bottom=0.76
    const entry = getAssetById("office-coffee-cup")!;
    const def = sceneObjectToPhysicsBodyDef(cupObj, entry)!;
    const roundTrip = physicsTransformToSessionPosition(
      def.position,
      entry.dimensions.height,
    );
    expect(roundTrip.y).toBeCloseTo(cupObj.position!.y, 5);
  });
});
