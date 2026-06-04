// Tests for AgentAvatar helper functions
// deriveBodyGeometry and deriveArmPose are pure functions — tested without rendering

import { describe, it, expect } from "vitest";
import { deriveBodyGeometry, deriveArmPose } from "./AgentAvatar";

// ── deriveBodyGeometry ────────────────────────────────────────────────────

describe("deriveBodyGeometry", () => {
  it("returns box geometry for humanoid preset", () => {
    const result = deriveBodyGeometry("humanoid");
    expect(result.bodyType).toBe("box");
  });

  it("returns box geometry for robot preset", () => {
    const result = deriveBodyGeometry("robot");
    expect(result.bodyType).toBe("box");
  });

  it("returns sphere geometry for abstract preset", () => {
    const result = deriveBodyGeometry("abstract");
    expect(result.bodyType).toBe("sphere");
  });

  it("robot preset has higher metalness than humanoid", () => {
    const robot = deriveBodyGeometry("robot");
    const humanoid = deriveBodyGeometry("humanoid");
    expect(robot.metalness).toBeGreaterThan(humanoid.metalness);
  });

  it("robot preset has wider body dims than humanoid", () => {
    const robot = deriveBodyGeometry("robot");
    const humanoid = deriveBodyGeometry("humanoid");
    // Width (index 0) should be wider for robot
    expect(robot.bodyDims[0]).toBeGreaterThan(humanoid.bodyDims[0]);
  });

  it("abstract preset has lower roughness than robot", () => {
    const abstract = deriveBodyGeometry("abstract");
    const robot = deriveBodyGeometry("robot");
    expect(abstract.roughness).toBeLessThan(robot.roughness);
  });

  it("all presets return valid positive dimensions", () => {
    for (const preset of ["humanoid", "robot", "abstract", "unknown"]) {
      const result = deriveBodyGeometry(preset);
      expect(result.bodyDims[0]).toBeGreaterThan(0);
      expect(result.headScale).toBeGreaterThan(0);
      expect(result.metalness).toBeGreaterThanOrEqual(0);
      expect(result.roughness).toBeGreaterThan(0);
    }
  });

  it("falls back to humanoid for unknown preset", () => {
    const unknown = deriveBodyGeometry("dragon");
    const humanoid = deriveBodyGeometry("humanoid");
    expect(unknown.bodyType).toBe(humanoid.bodyType);
    expect(unknown.bodyDims).toEqual(humanoid.bodyDims);
  });
});

// ── deriveArmPose ─────────────────────────────────────────────────────────

describe("deriveArmPose", () => {
  it("returns an object with all required arm position/rotation keys", () => {
    const result = deriveArmPose("standing");
    expect(result).toHaveProperty("leftArmPos");
    expect(result).toHaveProperty("rightArmPos");
    expect(result).toHaveProperty("leftArmRot");
    expect(result).toHaveProperty("rightArmRot");
  });

  it("each pos/rot is a 3-element tuple", () => {
    const result = deriveArmPose("standing");
    expect(result.leftArmPos).toHaveLength(3);
    expect(result.rightArmPos).toHaveLength(3);
    expect(result.leftArmRot).toHaveLength(3);
    expect(result.rightArmRot).toHaveLength(3);
  });

  it("waiting pose positions arms higher than standing (Y > standing Y)", () => {
    const standing = deriveArmPose("standing");
    const waiting = deriveArmPose("waiting");
    // Y coordinate (index 1) should be higher for waiting
    expect(waiting.leftArmPos[1]).toBeGreaterThan(standing.leftArmPos[1]);
    expect(waiting.rightArmPos[1]).toBeGreaterThan(standing.rightArmPos[1]);
  });

  it("waiting pose has non-zero z-rotation (arms splayed outward)", () => {
    const waiting = deriveArmPose("waiting");
    expect(waiting.leftArmRot[2]).not.toBe(0);
    expect(waiting.rightArmRot[2]).not.toBe(0);
  });

  it("thinking pose raises right arm to a higher Y position than standing", () => {
    const standing = deriveArmPose("standing");
    const thinking = deriveArmPose("thinking");
    expect(thinking.rightArmPos[1]).toBeGreaterThan(standing.rightArmPos[1]);
  });

  it("thinking pose has non-zero right arm rotation (arm bent)", () => {
    const thinking = deriveArmPose("thinking");
    const hasRotation =
      thinking.rightArmRot[0] !== 0 ||
      thinking.rightArmRot[1] !== 0 ||
      thinking.rightArmRot[2] !== 0;
    expect(hasRotation).toBe(true);
  });

  it("standing pose has zero rotations (arms straight down)", () => {
    const standing = deriveArmPose("standing");
    expect(standing.leftArmRot).toEqual([0, 0, 0]);
    expect(standing.rightArmRot).toEqual([0, 0, 0]);
  });

  it("falls back to standing for unknown pose", () => {
    const unknown = deriveArmPose("dancing");
    const standing = deriveArmPose("standing");
    expect(unknown.leftArmPos).toEqual(standing.leftArmPos);
    expect(unknown.rightArmPos).toEqual(standing.rightArmPos);
  });

  it("all three poses return different rightArmPos values", () => {
    const standing = deriveArmPose("standing");
    const waiting = deriveArmPose("waiting");
    const thinking = deriveArmPose("thinking");

    // At least Y position should differ between all three
    const yValues = [
      standing.rightArmPos[1],
      waiting.rightArmPos[1],
      thinking.rightArmPos[1],
    ];
    const uniqueY = new Set(yValues);
    expect(uniqueY.size).toBe(3);
  });
});
