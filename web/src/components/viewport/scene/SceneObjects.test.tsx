// Tests for SceneObjects — the scene object renderer.
//
// Strategy:
//   - @react-three/fiber and @react-three/drei are mocked so jsdom never
//     tries to initialise WebGL.
//   - OfficeAsset is mocked so tests verify routing logic (assetId present →
//     OfficeAsset called; no assetId → procedural fallback) without depending
//     on the GLB loader internals, which are covered by OfficeAsset.test.tsx.
//   - The standard office preset from baselineSession is used to verify that
//     all required MVP asset IDs trigger the OfficeAsset rendering path.
//
// Coverage:
//   - Objects with an assetId route to OfficeAsset
//   - Objects without an assetId render procedural fallback geometry
//   - Disabled objects are not rendered
//   - onViewEvent is forwarded for procedural objects
//   - Standard office preset has all required asset IDs mapped to OfficeAsset
//   - All ten MVP objects render without crashing

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// ── Mocks (must be declared before component imports) ────────────────────────

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", { "data-testid": "r3f-canvas" }, children),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({})),
}));

vi.mock("@react-three/drei", () => ({
  useGLTF: vi.fn(),
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", null, children),
}));

// Track calls so tests can assert which entries were passed to OfficeAsset.
const officeAssetCalls: Array<{ id: string; url: string }> = [];
const mockOfficeAsset = vi.fn(
  ({ entry }: { entry: { id: string; url: string }; [key: string]: unknown }) => {
    officeAssetCalls.push({ id: entry.id, url: entry.url });
    return React.createElement("div", { "data-office-asset-id": entry.id });
  },
);

vi.mock("./OfficeAsset", () => ({
  OfficeAsset: (props: { entry: { id: string; url: string }; [key: string]: unknown }) =>
    mockOfficeAsset(props),
}));

// ── Suppress jsdom noise ─────────────────────────────────────────────────────

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (
      msg.includes("is not a valid HTML element") ||
      msg.includes("Unknown prop") ||
      msg.includes("incorrect casing")
    ) {
      return;
    }
    console.warn(...args);
  });
});

afterEach(() => {
  officeAssetCalls.length = 0;
  mockOfficeAsset.mockClear();
});

// ── Imports under test (after mocks) ────────────────────────────────────────

import { SceneObjects } from "./SceneObjects";
import type { SceneObjectState } from "../../../state/sessionTypes";
import { baselineSession } from "../../../state/baselineSession";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const assetBackedObj: SceneObjectState = {
  id: "obj-desk",
  label: "Desk",
  type: "desk",
  enabled: true,
  assetId: "office-desk",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

const proceduralObj: SceneObjectState = {
  id: "obj-cabinet",
  label: "Storage",
  type: "cabinet",
  enabled: true,
  // no assetId — should fall back to procedural geometry
};

const disabledObj: SceneObjectState = {
  id: "obj-disabled",
  label: "Hidden",
  type: "desk",
  enabled: false,
  assetId: "office-desk",
};

// ── Routing: assetId → OfficeAsset ───────────────────────────────────────────

describe("SceneObjects — asset-backed routing", () => {
  it("renders without crashing with an asset-backed object", () => {
    expect(() => render(<SceneObjects objects={[assetBackedObj]} />)).not.toThrow();
  });

  it("calls OfficeAsset for an object with a valid assetId", () => {
    render(<SceneObjects objects={[assetBackedObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    expect(officeAssetCalls[0].id).toBe("office-desk");
  });

  it("passes the correct manifest URL to OfficeAsset", () => {
    render(<SceneObjects objects={[assetBackedObj]} />);
    expect(officeAssetCalls[0].url).toBe("/assets/office/office-desk.glb");
  });

  it("calls OfficeAsset for multiple asset-backed objects", () => {
    const monitorObj: SceneObjectState = {
      id: "obj-monitor",
      label: "Monitor",
      type: "monitor",
      enabled: true,
      assetId: "office-monitor",
    };
    render(<SceneObjects objects={[assetBackedObj, monitorObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledTimes(2);
    const renderedIds = officeAssetCalls.map((c) => c.id);
    expect(renderedIds).toContain("office-desk");
    expect(renderedIds).toContain("office-monitor");
  });

  it("does not call OfficeAsset for an unknown assetId (falls back to procedural)", () => {
    const unknownAsset: SceneObjectState = {
      id: "obj-unknown",
      label: "Unknown",
      type: "cabinet",
      enabled: true,
      assetId: "unknown-asset-xyz",
    };
    render(<SceneObjects objects={[unknownAsset]} />);
    // OfficeAsset should NOT be called since the assetId is not in the manifest
    expect(mockOfficeAsset).not.toHaveBeenCalled();
  });
});

// ── Routing: no assetId → procedural fallback ────────────────────────────────

describe("SceneObjects — procedural fallback routing", () => {
  it("renders without crashing for a procedural (no-assetId) object", () => {
    expect(() => render(<SceneObjects objects={[proceduralObj]} />)).not.toThrow();
  });

  it("does not call OfficeAsset for an object without assetId", () => {
    render(<SceneObjects objects={[proceduralObj]} />);
    expect(mockOfficeAsset).not.toHaveBeenCalled();
  });

  it("renders a <mesh> element for the procedural object", () => {
    const { container } = render(<SceneObjects objects={[proceduralObj]} />);
    expect(container.querySelector("mesh")).not.toBeNull();
  });

  it("renders both asset and procedural objects in the same list", () => {
    render(<SceneObjects objects={[assetBackedObj, proceduralObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce(); // only for assetBackedObj
    expect(officeAssetCalls[0].id).toBe("office-desk");
  });
});

// ── Disabled objects ──────────────────────────────────────────────────────────

describe("SceneObjects — disabled object filtering", () => {
  it("does not render a disabled object", () => {
    render(<SceneObjects objects={[disabledObj]} />);
    expect(mockOfficeAsset).not.toHaveBeenCalled();
  });

  it("renders enabled objects and skips disabled ones in a mixed list", () => {
    render(<SceneObjects objects={[assetBackedObj, disabledObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    expect(officeAssetCalls[0].id).toBe("office-desk");
  });
});

// ── onViewEvent forwarding ────────────────────────────────────────────────────

describe("SceneObjects — onViewEvent", () => {
  it("accepts onViewEvent prop without crashing", () => {
    const onViewEvent = vi.fn();
    expect(() =>
      render(<SceneObjects objects={[proceduralObj]} onViewEvent={onViewEvent} />),
    ).not.toThrow();
  });

  it("does not crash when onViewEvent is not provided", () => {
    expect(() => render(<SceneObjects objects={[proceduralObj]} />)).not.toThrow();
  });
});

// ── Standard office preset — all required MVP asset IDs ──────────────────────

describe("SceneObjects — standard office preset asset coverage", () => {
  const officeObjects = baselineSession.environment.objects;

  it("renders all 10 MVP office objects without crashing", () => {
    expect(() => render(<SceneObjects objects={officeObjects} />)).not.toThrow();
  });

  it("calls OfficeAsset for every enabled object in the standard office preset", () => {
    render(<SceneObjects objects={officeObjects} />);
    const enabledCount = officeObjects.filter((o) => o.enabled).length;
    expect(mockOfficeAsset).toHaveBeenCalledTimes(enabledCount);
  });

  const requiredAssetIds = [
    "office-desk",
    "office-chair",
    "office-laptop",
    "office-keyboard",
    "office-monitor",
    "office-trash-can",
    "office-book-stack",
    "office-coffee-cup",
    "office-notebook",
  ];

  it.each(requiredAssetIds)(
    "office preset renders asset ID: %s via OfficeAsset",
    (assetId) => {
      render(<SceneObjects objects={officeObjects} />);
      const rendered = officeAssetCalls.map((c) => c.id);
      expect(rendered).toContain(assetId);
    },
  );

  it("desk object uses /assets/office/office-desk.glb", () => {
    render(<SceneObjects objects={officeObjects} />);
    const deskCall = officeAssetCalls.find((c) => c.id === "office-desk");
    expect(deskCall).toBeDefined();
    expect(deskCall?.url).toBe("/assets/office/office-desk.glb");
  });

  it("all rendered GLB URLs start with /assets/office/ (no external hosts)", () => {
    render(<SceneObjects objects={officeObjects} />);
    officeAssetCalls.forEach((call) => {
      expect(call.url).toMatch(/^\/assets\/office\/.+\.glb$/);
      expect(call.url).not.toMatch(/^https?:\/\//);
    });
  });

  it("clutter props include book-stack, coffee-cup, and notebook", () => {
    render(<SceneObjects objects={officeObjects} />);
    const rendered = officeAssetCalls.map((c) => c.id);
    expect(rendered).toContain("office-book-stack");
    expect(rendered).toContain("office-coffee-cup");
    expect(rendered).toContain("office-notebook");
  });

  it("renders at least 10 OfficeAsset components for the full MVP set", () => {
    render(<SceneObjects objects={officeObjects} />);
    expect(mockOfficeAsset.mock.calls.length).toBeGreaterThanOrEqual(10);
  });
});

// ── selectedObjectId forwarding ───────────────────────────────────────────────

describe("SceneObjects — selectedObjectId", () => {
  it("accepts selectedObjectId prop without crashing (asset-backed object)", () => {
    expect(() =>
      render(<SceneObjects objects={[assetBackedObj]} selectedObjectId="obj-desk" />),
    ).not.toThrow();
  });

  it("accepts selectedObjectId prop without crashing (procedural object)", () => {
    expect(() =>
      render(<SceneObjects objects={[proceduralObj]} selectedObjectId="obj-cabinet" />),
    ).not.toThrow();
  });
});

// ── OfficeAsset props: isSelected + onViewEvent ───────────────────────────────

describe("SceneObjects — OfficeAsset receives isSelected and onViewEvent", () => {
  it("passes isSelected=true to OfficeAsset when selectedObjectId matches", () => {
    render(<SceneObjects objects={[assetBackedObj]} selectedObjectId="obj-desk" />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    const call = mockOfficeAsset.mock.calls[0][0] as Record<string, unknown>;
    expect(call.isSelected).toBe(true);
  });

  it("passes isSelected=false to OfficeAsset when selectedObjectId does not match", () => {
    render(<SceneObjects objects={[assetBackedObj]} selectedObjectId="other-id" />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    const call = mockOfficeAsset.mock.calls[0][0] as Record<string, unknown>;
    expect(call.isSelected).toBe(false);
  });

  it("passes isSelected=false to OfficeAsset when no selectedObjectId", () => {
    render(<SceneObjects objects={[assetBackedObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    const call = mockOfficeAsset.mock.calls[0][0] as Record<string, unknown>;
    expect(call.isSelected).toBe(false);
  });

  it("passes onViewEvent to OfficeAsset when provided", () => {
    const onViewEvent = vi.fn();
    render(<SceneObjects objects={[assetBackedObj]} onViewEvent={onViewEvent} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    const call = mockOfficeAsset.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof call.onViewEvent).toBe("function");
  });

  it("passes objectId (scene object id, not manifest id) to OfficeAsset", () => {
    render(<SceneObjects objects={[assetBackedObj]} />);
    expect(mockOfficeAsset).toHaveBeenCalledOnce();
    const call = mockOfficeAsset.mock.calls[0][0] as Record<string, unknown>;
    // objectId should be the scene object ID ("obj-desk"), not manifest ID ("office-desk")
    expect(call.objectId).toBe("obj-desk");
  });
});
