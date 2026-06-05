// minimalPhysicsAdapter.test.ts
// Deterministic unit tests for MinimalPhysicsAdapter.
//
// These tests use only pure-JS values and the CPU-only MinimalPhysicsAdapter.
// No WebAssembly, no GPU, no browser APIs, no Three.js.
//
// Test categories:
//   1. Gravity: a free-falling dynamic body descends under gravity.
//   2. Contact / settling: a dynamic body lands on a static floor and rests.
//   3. Lateral isolation: a dynamic body does not drift without horizontal force.
//   4. Static body immobility: static bodies do not move.
//   5. Manifest props: real manifest objects (coffee cup, laptop) can be
//      added and simulated without errors.
//   6. Lifecycle: addBody / removeBody / reset behave correctly.
//
// Acceptance criterion CRIT-4 from plans/browser-runtime-physics-plan.md:
//   minimalPhysicsAdapter.test.ts contains a deterministic test that starts
//   a dynamic prop above a static floor, steps the simulation, and asserts
//   the prop has fallen and settled — passing with no GPU, no WASM, no
//   browser environment.

import { describe, it, expect, beforeEach } from "vitest";
import { MinimalPhysicsAdapter } from "./minimalPhysicsAdapter";
import type { PhysicsBodyDef } from "./physicsAdapter";
import { sceneObjectsToPhysicsBodyDefs } from "./manifestPhysicsMapping";
import { OFFICE_ASSET_MANIFEST } from "../assets/officeAssetManifest";
import type { SceneObjectState } from "../state/sessionTypes";

// ── Fixture helpers ───────────────────────────────────────────────────────────

/** Static floor: 10 m wide, 0.1 m thick, centered at (0, 0, 0). */
function floorDef(): PhysicsBodyDef {
  return {
    id: "floor",
    bodyType: "static",
    colliderType: "box",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 10, height: 0.1, depth: 10 },
  };
}

/**
 * Dynamic box: 0.2 × 0.2 × 0.2 m, 1 kg, inelastic (restitution=0).
 * @param startY CENTER Y position (above the floor).
 */
function dynamicBox(startY: number): PhysicsBodyDef {
  return {
    id: "box",
    bodyType: "dynamic",
    colliderType: "box",
    position: { x: 0, y: startY, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 0.2, height: 0.2, depth: 0.2 },
    massKg: 1.0,
    friction: 0.5,
    restitution: 0.0, // perfectly inelastic → settles without bouncing
  };
}

/** Step `adapter` forward by `totalSeconds` at `hz` steps per second. */
function runFor(adapter: MinimalPhysicsAdapter, totalSeconds: number, hz = 60): void {
  const dt = 1 / hz;
  const steps = Math.round(totalSeconds * hz);
  for (let i = 0; i < steps; i++) {
    adapter.step(dt);
  }
}

// ── Gravity tests ─────────────────────────────────────────────────────────────

describe("MinimalPhysicsAdapter — gravity", () => {
  let adapter: MinimalPhysicsAdapter;

  beforeEach(async () => {
    adapter = new MinimalPhysicsAdapter();
    await adapter.init();
  });

  it("init() resolves without errors", async () => {
    // Should already resolve in beforeEach; just confirm the instance is ready.
    expect(adapter).toBeInstanceOf(MinimalPhysicsAdapter);
  });

  it("a free-falling body descends under gravity (no contacts)", async () => {
    adapter.addBody(dynamicBox(2.0)); // start at center Y = 2 m

    // Step 0.5 s — expected free-fall: y = y0 + 0.5·g·t²
    // y_center = 2.0 + 0.5 * (-9.81) * 0.5² ≈ 2.0 - 1.226 = 0.774
    runFor(adapter, 0.5);

    const t = adapter.getTransform("box")!;
    expect(t).toBeDefined();
    expect(t.position.y).toBeLessThan(2.0); // must have fallen
    // Loose bound: should have fallen at least 1 m in 0.5 s
    expect(t.position.y).toBeLessThan(1.1);
  });

  it("a free-falling body falls further the longer it runs", async () => {
    adapter.addBody(dynamicBox(10.0));

    runFor(adapter, 0.25);
    const y025 = adapter.getTransform("box")!.position.y;

    runFor(adapter, 0.25); // total 0.5 s
    const y050 = adapter.getTransform("box")!.position.y;

    expect(y025).toBeLessThan(10.0);
    expect(y050).toBeLessThan(y025); // accelerating fall
  });

  it("X and Z remain near zero for a body falling straight down", async () => {
    adapter.addBody(dynamicBox(2.0));
    runFor(adapter, 0.5);

    const t = adapter.getTransform("box")!;
    expect(t.position.x).toBeCloseTo(0, 3); // < 0.001 m drift
    expect(t.position.z).toBeCloseTo(0, 3);
  });
});

// ── Contact / settling tests ──────────────────────────────────────────────────

describe("MinimalPhysicsAdapter — contact resolution and settling (CRIT-4)", () => {
  let adapter: MinimalPhysicsAdapter;

  beforeEach(async () => {
    adapter = new MinimalPhysicsAdapter();
    await adapter.init();
  });

  /**
   * CORE DETERMINISM TEST (Acceptance Criterion CRIT-4)
   *
   * Scenario: a dynamic box starts at Y = 1.0 m above a static floor.
   * After 1 s of simulation the box must have:
   *   1. Fallen (Y < 1.0)
   *   2. Settled on the floor (Y ≈ floor_top + box_half_height)
   *   3. Reached the expected resting position deterministically
   *
   * Floor:   center Y = 0, half-height = 0.05 m → top face at Y = 0.05
   * Box:     half-height = 0.1 m → resting center Y = 0.05 + 0.1 = 0.15
   */
  it("CRIT-4: dynamic box falls and settles on static floor (deterministic)", async () => {
    adapter.addBody(floorDef());
    adapter.addBody(dynamicBox(1.0));

    runFor(adapter, 1.0); // 60 steps × 1/60 s

    const t = adapter.getTransform("box")!;
    expect(t).toBeDefined();

    // Must have fallen from starting position
    expect(t.position.y).toBeLessThan(1.0);

    // Must have settled: resting center Y = floor_top_y + box_half_height
    // floor top = 0 + 0.05 = 0.05; box half-height = 0.1 → rest center = 0.15
    const expectedRestY = 0.05 + 0.1; // 0.15
    expect(t.position.y).toBeCloseTo(expectedRestY, 1);

    // X and Z must not have drifted
    expect(t.position.x).toBeCloseTo(0, 2);
    expect(t.position.z).toBeCloseTo(0, 2);
  });

  it("box started directly on the floor does not fall through", async () => {
    // Box placed with its bottom face exactly on the floor top (Y = 0.05 + 0.1 = 0.15)
    adapter.addBody(floorDef());
    adapter.addBody({
      ...dynamicBox(0.15), // resting position
      id: "resting-box",
    });

    runFor(adapter, 1.0);

    const t = adapter.getTransform("resting-box")!;
    // Box should not have sunk below the floor
    expect(t.position.y).toBeGreaterThanOrEqual(0.14); // allow 1 cm tolerance
    expect(t.position.y).toBeLessThanOrEqual(0.16);
  });

  it("box falls from a greater height and still settles", async () => {
    adapter.addBody(floorDef());
    adapter.addBody(dynamicBox(5.0));

    runFor(adapter, 2.0); // 2 s — enough to fall 5 m

    const t = adapter.getTransform("box")!;
    const expectedRestY = 0.05 + 0.1; // 0.15
    expect(t.position.y).toBeCloseTo(expectedRestY, 1);
  });

  it("static body does not move when another body lands on it", async () => {
    adapter.addBody(floorDef());
    adapter.addBody(dynamicBox(2.0));

    runFor(adapter, 2.0);

    const floor = adapter.getTransform("floor")!;
    expect(floor.position.x).toBeCloseTo(0);
    expect(floor.position.y).toBeCloseTo(0); // unchanged
    expect(floor.position.z).toBeCloseTo(0);
  });
});

// ── Multiple bodies ───────────────────────────────────────────────────────────

describe("MinimalPhysicsAdapter — multiple bodies", () => {
  let adapter: MinimalPhysicsAdapter;

  beforeEach(async () => {
    adapter = new MinimalPhysicsAdapter();
    await adapter.init();
  });

  it("two dynamic boxes both fall independently", async () => {
    adapter.addBody({ ...dynamicBox(2.0), id: "box-a", position: { x: -1, y: 2, z: 0 } });
    adapter.addBody({ ...dynamicBox(3.0), id: "box-b", position: { x: 1, y: 3, z: 0 } });

    runFor(adapter, 0.5);

    const a = adapter.getTransform("box-a")!;
    const b = adapter.getTransform("box-b")!;

    expect(a.position.y).toBeLessThan(2.0);
    expect(b.position.y).toBeLessThan(3.0);
    // Higher start → should still be above lower-start box after same time
    expect(b.position.y).toBeGreaterThan(a.position.y);
  });

  it("getTransforms() returns all registered bodies", async () => {
    adapter.addBody(floorDef());
    adapter.addBody(dynamicBox(1.0));

    const transforms = adapter.getTransforms();
    expect(transforms).toHaveLength(2);
    expect(transforms.map((t) => t.id)).toEqual(expect.arrayContaining(["floor", "box"]));
  });
});

// ── Lifecycle tests ───────────────────────────────────────────────────────────

describe("MinimalPhysicsAdapter — lifecycle", () => {
  let adapter: MinimalPhysicsAdapter;

  beforeEach(async () => {
    adapter = new MinimalPhysicsAdapter();
    await adapter.init();
  });

  it("getTransform returns undefined for an unknown id", () => {
    expect(adapter.getTransform("nonexistent")).toBeUndefined();
  });

  it("removeBody removes the body from getTransforms", () => {
    adapter.addBody(dynamicBox(1.0));
    expect(adapter.getTransform("box")).toBeDefined();

    adapter.removeBody("box");
    expect(adapter.getTransform("box")).toBeUndefined();
    expect(adapter.getTransforms()).toHaveLength(0);
  });

  it("removeBody is a no-op for an unknown id", () => {
    expect(() => adapter.removeBody("ghost")).not.toThrow();
  });

  it("reset() clears all bodies", () => {
    adapter.addBody(floorDef());
    adapter.addBody(dynamicBox(1.0));
    expect(adapter.getTransforms()).toHaveLength(2);

    adapter.reset();
    expect(adapter.getTransforms()).toHaveLength(0);
  });

  it("addBody with the same id replaces the existing body", () => {
    adapter.addBody(dynamicBox(1.0));
    adapter.addBody({ ...dynamicBox(5.0), id: "box" }); // same id, different position

    const t = adapter.getTransform("box")!;
    expect(t.position.y).toBeCloseTo(5.0); // replaced, not stacked
    expect(adapter.getTransforms()).toHaveLength(1);
  });

  it("addBody with colliderType 'none' does not add the body", () => {
    adapter.addBody({
      ...dynamicBox(1.0),
      id: "invisible",
      colliderType: "none",
    });
    expect(adapter.getTransform("invisible")).toBeUndefined();
    expect(adapter.getTransforms()).toHaveLength(0);
  });
});

// ── Manifest integration ──────────────────────────────────────────────────────

describe("MinimalPhysicsAdapter — manifest prop integration", () => {
  let adapter: MinimalPhysicsAdapter;

  beforeEach(async () => {
    adapter = new MinimalPhysicsAdapter();
    await adapter.init();
  });

  it("desk (static) and coffee cup (dynamic) can be added from manifest without errors", async () => {
    const desk: SceneObjectState = {
      id: "desk-1",
      label: "Desk",
      type: "desk",
      enabled: true,
      assetId: "office-desk",
      position: { x: 0, y: 0, z: 0 },
    };
    const cup: SceneObjectState = {
      id: "cup-1",
      label: "Coffee Cup",
      type: "cup",
      enabled: true,
      assetId: "office-coffee-cup",
      // Place cup 0.5 m above the desk top surface
      // desk top = 0 + 0.75 = 0.75 m; add 0.5 m clearance → bottom_y = 1.25
      position: { x: 0, y: 1.25, z: 0 },
    };

    const defs = sceneObjectsToPhysicsBodyDefs([desk, cup]);
    expect(defs).toHaveLength(2);

    defs.forEach((def) => adapter.addBody(def));
    expect(adapter.getTransforms()).toHaveLength(2);

    // Step 2 s — cup should fall
    runFor(adapter, 2.0);

    const cupTransform = adapter.getTransform("cup-1")!;
    expect(cupTransform).toBeDefined();
    // Cup started at bottom_y=1.25 → center_y=1.25+0.05=1.30
    // Must have fallen
    expect(cupTransform.position.y).toBeLessThan(1.3);
  });

  it("all manifest entries produce stable body defs and do not throw when stepped", async () => {
    const sceneObjects: SceneObjectState[] = OFFICE_ASSET_MANIFEST.map((entry, i) => ({
      id: `prop-${i}`,
      label: entry.label,
      type: entry.category,
      enabled: true,
      assetId: entry.id,
      position: {
        x: i * 2, // spread out so they don't collide
        y: 0,
        z: 0,
      },
    }));

    const defs = sceneObjectsToPhysicsBodyDefs(sceneObjects);
    defs.forEach((def) => adapter.addBody(def));

    // Should not throw when stepped
    expect(() => runFor(adapter, 0.1)).not.toThrow();
    expect(adapter.getTransforms()).toHaveLength(defs.length);
  });
});
