// rapierPhysicsAdapter.test.ts
// Interface-level tests for RapierPhysicsAdapter.
//
// These tests verify that RapierPhysicsAdapter:
//   1. Initializes without errors (WASM loads via base64 in the compat package).
//   2. Implements the PhysicsAdapter interface contract.
//   3. A dynamic body falls under gravity when stepped.
//   4. A static body does not move.
//   5. addBody / removeBody / reset / getTransform lifecycle is correct.
//
// Rapier WASM initialization uses @dimforge/rapier3d-compat which inlines
// the binary as base64 — no network fetch, no GPU required.
//
// Note: these tests are slower than the MinimalPhysicsAdapter tests because
// WASM initialization adds overhead on first import. They are included in
// the default `make test` run because all new code must be covered by tests.

import { describe, it, expect, beforeEach } from "vitest";
import { RapierPhysicsAdapter } from "./rapierPhysicsAdapter";
import type { PhysicsBodyDef } from "./physicsAdapter";

// ── Fixture helpers ───────────────────────────────────────────────────────────

function staticFloor(): PhysicsBodyDef {
  return {
    id: "floor",
    bodyType: "static",
    colliderType: "box",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 10, height: 0.1, depth: 10 },
  };
}

function dynamicCube(id: string, centerY: number): PhysicsBodyDef {
  return {
    id,
    bodyType: "dynamic",
    colliderType: "box",
    position: { x: 0, y: centerY, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 0.2, height: 0.2, depth: 0.2 },
    massKg: 1.0,
    friction: 0.5,
    restitution: 0.0,
  };
}

function cylinderDef(id: string, centerY: number): PhysicsBodyDef {
  return {
    id,
    bodyType: "dynamic",
    colliderType: "cylinder",
    position: { x: 0, y: centerY, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 0.08, height: 0.1, depth: 0.08 }, // coffee cup
    massKg: 0.3,
    friction: 0.4,
    restitution: 0.1,
  };
}

function runFor(adapter: RapierPhysicsAdapter, totalSeconds: number, hz = 60): void {
  const dt = 1 / hz;
  const steps = Math.round(totalSeconds * hz);
  for (let i = 0; i < steps; i++) {
    adapter.step(dt);
  }
}

// ── Initialization ────────────────────────────────────────────────────────────

describe("RapierPhysicsAdapter — initialization", () => {
  it("init() resolves without error", async () => {
    const adapter = new RapierPhysicsAdapter();
    await expect(adapter.init()).resolves.not.toThrow();
  });

  it("step() before init() throws", () => {
    const adapter = new RapierPhysicsAdapter();
    expect(() => adapter.step(1 / 60)).toThrow(/init\(\)/);
  });

  it("init() is idempotent — calling it twice does not throw", async () => {
    const adapter = new RapierPhysicsAdapter();
    await adapter.init();
    await expect(adapter.init()).resolves.not.toThrow();
  });
});

// ── Gravity and dynamics ──────────────────────────────────────────────────────

describe("RapierPhysicsAdapter — gravity", () => {
  let adapter: RapierPhysicsAdapter;

  beforeEach(async () => {
    adapter = new RapierPhysicsAdapter();
    await adapter.init();
  });

  it("a dynamic body falls under gravity", async () => {
    adapter.addBody(dynamicCube("box", 2.0));

    runFor(adapter, 0.5);

    const t = adapter.getTransform("box")!;
    expect(t).toBeDefined();
    expect(t.position.y).toBeLessThan(2.0); // must have fallen
  });

  it("a static body does not move", async () => {
    adapter.addBody(staticFloor());

    runFor(adapter, 1.0);

    const floor = adapter.getTransform("floor")!;
    expect(floor.position.y).toBeCloseTo(0, 3);
  });

  it("a dynamic cylinder body falls under gravity", async () => {
    adapter.addBody(cylinderDef("cup", 2.0));

    runFor(adapter, 0.5);

    const t = adapter.getTransform("cup")!;
    expect(t).toBeDefined();
    expect(t.position.y).toBeLessThan(2.0);
  });
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

describe("RapierPhysicsAdapter — lifecycle", () => {
  let adapter: RapierPhysicsAdapter;

  beforeEach(async () => {
    adapter = new RapierPhysicsAdapter();
    await adapter.init();
  });

  it("getTransform returns undefined for an unregistered id", () => {
    expect(adapter.getTransform("ghost")).toBeUndefined();
  });

  it("addBody registers the body and getTransform returns a result", () => {
    adapter.addBody(dynamicCube("cube", 1.0));
    const t = adapter.getTransform("cube");
    expect(t).toBeDefined();
    expect(t!.id).toBe("cube");
  });

  it("removeBody removes the body from getTransforms", () => {
    adapter.addBody(dynamicCube("cube", 1.0));
    adapter.removeBody("cube");
    expect(adapter.getTransform("cube")).toBeUndefined();
    expect(adapter.getTransforms()).toHaveLength(0);
  });

  it("removeBody is a no-op for an unknown id", () => {
    expect(() => adapter.removeBody("nonexistent")).not.toThrow();
  });

  it("reset() clears all bodies", () => {
    adapter.addBody(staticFloor());
    adapter.addBody(dynamicCube("cube", 1.0));
    expect(adapter.getTransforms()).toHaveLength(2);

    adapter.reset();
    expect(adapter.getTransforms()).toHaveLength(0);
  });

  it("getTransforms() returns all registered bodies", () => {
    adapter.addBody(staticFloor());
    adapter.addBody(dynamicCube("cube", 1.0));
    const transforms = adapter.getTransforms();
    expect(transforms).toHaveLength(2);
    expect(transforms.map((t) => t.id)).toEqual(
      expect.arrayContaining(["floor", "cube"]),
    );
  });

  it("addBody with colliderType 'none' does not register the body", () => {
    adapter.addBody({
      ...dynamicCube("invisible", 1.0),
      colliderType: "none",
    });
    expect(adapter.getTransform("invisible")).toBeUndefined();
    expect(adapter.getTransforms()).toHaveLength(0);
  });
});
