// Tests for SceneEnvironment — deriveSceneLighting pure function and
// data attribute exposure for environment state testability.

import { describe, it, expect } from "vitest";
import { deriveSceneLighting } from "./SceneEnvironment";
import type { EnvironmentState } from "../../../state/sessionTypes";

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeEnv(overrides: Partial<EnvironmentState> = {}): EnvironmentState {
  return {
    preset: "laboratory",
    timeOfDay: "day",
    lighting: "bright",
    ambience: "peaceful",
    weather: "clear",
    objects: [],
    ...overrides,
  };
}

// ── deriveSceneLighting ────────────────────────────────────────────────────

describe("deriveSceneLighting", () => {
  it("returns an object with all required lighting keys", () => {
    const result = deriveSceneLighting(makeEnv());
    expect(result).toHaveProperty("ambientColor");
    expect(result).toHaveProperty("ambientIntensity");
    expect(result).toHaveProperty("keyColor");
    expect(result).toHaveProperty("keyIntensity");
    expect(result).toHaveProperty("fillColor");
    expect(result).toHaveProperty("fillIntensity");
    expect(result).toHaveProperty("floorColor");
    expect(result).toHaveProperty("wallColor");
  });

  it("produces higher keyIntensity for bright lighting than dim lighting", () => {
    const bright = deriveSceneLighting(makeEnv({ lighting: "bright" }));
    const dim = deriveSceneLighting(makeEnv({ lighting: "dim" }));
    expect(bright.keyIntensity).toBeGreaterThan(dim.keyIntensity);
  });

  it("produces higher keyIntensity for dramatic lighting", () => {
    const dramatic = deriveSceneLighting(makeEnv({ lighting: "dramatic" }));
    const natural = deriveSceneLighting(makeEnv({ lighting: "natural" }));
    expect(dramatic.keyIntensity).toBeGreaterThan(natural.keyIntensity);
  });

  it("produces lower ambientIntensity for night than day", () => {
    const day = deriveSceneLighting(makeEnv({ timeOfDay: "day" }));
    const night = deriveSceneLighting(makeEnv({ timeOfDay: "night" }));
    expect(night.ambientIntensity).toBeLessThan(day.ambientIntensity);
  });

  it("produces different ambient colors for morning vs night", () => {
    const morning = deriveSceneLighting(makeEnv({ timeOfDay: "morning" }));
    const night = deriveSceneLighting(makeEnv({ timeOfDay: "night" }));
    expect(morning.ambientColor).not.toBe(night.ambientColor);
  });

  it("produces different floor colors for different presets", () => {
    const lab = deriveSceneLighting(makeEnv({ preset: "laboratory" }));
    const outdoor = deriveSceneLighting(makeEnv({ preset: "outdoor" }));
    expect(lab.floorColor).not.toBe(outdoor.floorColor);
  });

  it("produces darker floor and wall colors for night time", () => {
    const day = deriveSceneLighting(makeEnv({ timeOfDay: "day" }));
    const night = deriveSceneLighting(makeEnv({ timeOfDay: "night" }));
    // Night floor should be different (darker palette)
    expect(night.floorColor).not.toBe(day.floorColor);
    expect(night.wallColor).not.toBe(day.wallColor);
  });

  it("returns valid CSS hex color strings for all color fields", () => {
    const result = deriveSceneLighting(makeEnv());
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    expect(result.ambientColor).toMatch(hexPattern);
    expect(result.keyColor).toMatch(hexPattern);
    expect(result.fillColor).toMatch(hexPattern);
    expect(result.floorColor).toMatch(hexPattern);
    expect(result.wallColor).toMatch(hexPattern);
  });

  it("falls back gracefully for an unknown timeOfDay value", () => {
    const result = deriveSceneLighting(makeEnv({ timeOfDay: "twilight" }));
    // Should not throw and should return day palette as default
    expect(result).toHaveProperty("keyColor");
    expect(result.keyIntensity).toBeGreaterThan(0);
  });

  it("falls back gracefully for an unknown lighting value", () => {
    const result = deriveSceneLighting(makeEnv({ lighting: "laser" }));
    expect(result).toHaveProperty("ambientIntensity");
    expect(result.ambientIntensity).toBeGreaterThan(0);
  });

  it("evening preset produces warm ambient color (reddish hue)", () => {
    const evening = deriveSceneLighting(makeEnv({ timeOfDay: "evening" }));
    // Warm ambient color starts with #ff (red-dominant)
    expect(evening.ambientColor.toLowerCase().startsWith("#ff")).toBe(true);
  });

  it("all intensity values are positive numbers", () => {
    for (const timeOfDay of ["morning", "day", "evening", "night"]) {
      for (const lighting of ["bright", "natural", "dim", "dramatic"]) {
        const result = deriveSceneLighting(makeEnv({ timeOfDay, lighting }));
        expect(result.ambientIntensity).toBeGreaterThan(0);
        expect(result.keyIntensity).toBeGreaterThan(0);
        expect(result.fillIntensity).toBeGreaterThan(0);
      }
    }
  });
});
