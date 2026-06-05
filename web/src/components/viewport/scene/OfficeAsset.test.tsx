// Tests for OfficeAsset — GLB loader boundary component
//
// Strategy:
//   1. deriveFallbackProps() is a pure function — tested directly, no mocks needed.
//   2. The component is tested with @react-three/fiber and @react-three/drei
//      mocked so jsdom never tries to parse a real GLB file or initialise WebGL.
//   3. R3F intrinsic elements (mesh, group, primitive, etc.) render as HTML
//      custom elements in jsdom — we query by tag name to distinguish the
//      fallback (renders <mesh>) from the loaded state (renders <primitive>).
//
// Test coverage:
//   - deriveFallbackProps: dimensions match entry, each category gets a color
//   - Loading state: useGLTF suspends (throws a Promise) → fallback mesh visible
//   - Success state: useGLTF returns a scene → primitive element visible
//   - Error state: useGLTF throws an Error → ErrorBoundary shows fallback mesh
//   - URL safety: the URL passed to useGLTF starts with /assets/office/ (local only)

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React, { Suspense } from "react";

// ── Mocks (must be declared before component imports) ────────────────────────

vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", { "data-testid": "r3f-canvas" }, children),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({})),
}));

// useGLTF is configured per-test via mockImplementation.
// Default is a successful load returning a clonable scene object.
const mockUseGLTF = vi.fn();
vi.mock("@react-three/drei", () => ({
  useGLTF: (...args: unknown[]) => mockUseGLTF(...args),
}));

// ── Suppress jsdom noise from R3F intrinsic elements + ErrorBoundary ─────────

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (
      // Unknown HTML element warnings (R3F intrinsic elements in jsdom)
      msg.includes("is not a valid HTML element") ||
      msg.includes("Unknown prop") ||
      msg.includes("incorrect casing") ||
      // React ErrorBoundary noise
      msg.includes("The above error occurred") ||
      msg.includes("Consider adding an error boundary") ||
      // act() warning from Suspense in tests
      msg.includes("act(...")
    ) {
      return;
    }
    // Pass everything else through as a warning so real failures are visible
    console.warn(...args);
  });
});

afterEach(() => {
  mockUseGLTF.mockReset();
});

// ── Import under test (after mocks) ─────────────────────────────────────────

import { OfficeAsset, deriveFallbackProps } from "./OfficeAsset";
import type { OfficeAssetEntry } from "../../../assets/officeAssetManifest";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal desk entry used in most tests */
const deskEntry: OfficeAssetEntry = {
  id: "office-desk",
  label: "Office Desk",
  semanticLabel: "large office desk with a flat work surface",
  category: "furniture",
  url: "/assets/office/office-desk.glb",
  sourceName: "Kenney Furniture Kit",
  sourceUrl: "https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z",
  licenseId: "CC0-1.0",
  licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  defaultTransform: {
    position: { x: 1, y: 0, z: -2 },
    rotation: { x: 0, y: 45, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  },
  dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
  bodyType: "static",
  colliderType: "box",
  agentSafe: false,
  affordances: ["work-surface"],
};

const deviceEntry: OfficeAssetEntry = {
  ...deskEntry,
  id: "office-monitor",
  label: "Monitor",
  semanticLabel: "desktop monitor displaying a screen",
  category: "device",
  url: "/assets/office/office-monitor.glb",
  dimensions: { width: 0.5, height: 0.4, depth: 0.2 },
  bodyType: "static",
  colliderType: "box",
  agentSafe: false,
  affordances: ["displayable"],
};

const containerEntry: OfficeAssetEntry = {
  ...deskEntry,
  id: "office-trash-can",
  label: "Trash Can",
  semanticLabel: "cylindrical office waste bin",
  category: "container",
  url: "/assets/office/office-trash-can.glb",
  dimensions: { width: 0.3, height: 0.45, depth: 0.3 },
  bodyType: "dynamic",
  colliderType: "cylinder",
  massKg: 1.5,
  agentSafe: true,
  affordances: ["waste-container", "pickup"],
};

const clutterEntry: OfficeAssetEntry = {
  ...deskEntry,
  id: "office-coffee-cup",
  label: "Coffee Cup",
  semanticLabel: "ceramic coffee cup on the desk",
  category: "clutter",
  url: "/assets/office/office-coffee-cup.glb",
  dimensions: { width: 0.08, height: 0.1, depth: 0.08 },
  bodyType: "dynamic",
  colliderType: "cylinder",
  massKg: 0.3,
  agentSafe: true,
  affordances: ["containable", "pickup"],
};

// ── Helper: a mock scene object returned by useGLTF on success ───────────────

function makeSuccessScene() {
  const clonedScene = { type: "Group", children: [] };
  const scene = { clone: vi.fn().mockReturnValue(clonedScene) };
  return { scene };
}

// ── deriveFallbackProps (pure function) ──────────────────────────────────────

describe("deriveFallbackProps", () => {
  it("returns dimensions matching the entry dimensions tuple", () => {
    const result = deriveFallbackProps(deskEntry);
    expect(result.dims).toEqual([
      deskEntry.dimensions.width,
      deskEntry.dimensions.height,
      deskEntry.dimensions.depth,
    ]);
  });

  it("returns a 3-element tuple for dims", () => {
    const result = deriveFallbackProps(deskEntry);
    expect(result.dims).toHaveLength(3);
    result.dims.forEach((d) => expect(typeof d).toBe("number"));
  });

  it("returns a CSS hex color string", () => {
    const result = deriveFallbackProps(deskEntry);
    expect(result.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("furniture category uses a warm brown color", () => {
    const { color } = deriveFallbackProps(deskEntry); // category: furniture
    expect(color).toBe("#5c4033");
  });

  it("device category uses a dark navy color", () => {
    const { color } = deriveFallbackProps(deviceEntry); // category: device
    expect(color).toBe("#2c3e50");
  });

  it("container category uses a slate color", () => {
    const { color } = deriveFallbackProps(containerEntry); // category: container
    expect(color).toBe("#4a5568");
  });

  it("clutter category uses a muted purple-grey color", () => {
    const { color } = deriveFallbackProps(clutterEntry); // category: clutter
    expect(color).toBe("#6b6b8a");
  });

  it("unknown category falls back to a neutral grey", () => {
    const unknownEntry: OfficeAssetEntry = {
      ...deskEntry,
      category: "furniture", // TS requires valid category, but test overrides
    };
    // Force an unknown category via type cast to simulate future extension
    const result = deriveFallbackProps({
      ...unknownEntry,
      category: "prop" as unknown as typeof unknownEntry.category,
    });
    expect(result.color).toBe("#666688");
  });

  it("preserves exact dimensions — desk entry", () => {
    const { dims } = deriveFallbackProps(deskEntry);
    expect(dims[0]).toBe(1.4);
    expect(dims[1]).toBe(0.75);
    expect(dims[2]).toBe(0.7);
  });

  it("preserves exact dimensions — device entry", () => {
    const { dims } = deriveFallbackProps(deviceEntry);
    expect(dims[0]).toBe(0.5);
    expect(dims[1]).toBe(0.4);
    expect(dims[2]).toBe(0.2);
  });

  it("each category produces a different color", () => {
    const colors = [
      deriveFallbackProps(deskEntry).color,
      deriveFallbackProps(deviceEntry).color,
      deriveFallbackProps(containerEntry).color,
      deriveFallbackProps(clutterEntry).color,
    ];
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });
});

// ── OfficeAsset component ─────────────────────────────────────────────────────

describe("OfficeAsset — loading state", () => {
  it("renders the fallback mesh while useGLTF is pending (Suspense)", async () => {
    // useGLTF throws a never-resolving Promise → Suspense shows AssetFallback
    mockUseGLTF.mockImplementation(() => {
      throw new Promise<void>(() => {});
    });

    const { container } = render(
      // Wrap in an outer Suspense so the test itself doesn't throw
      <Suspense fallback={<div data-testid="outer-suspense" />}>
        <OfficeAsset entry={deskEntry} />
      </Suspense>,
    );

    // Inner Suspense boundary in OfficeAsset should have caught the suspension
    // and rendered AssetFallback (a <mesh> element) instead of <primitive>.
    await waitFor(() => {
      const meshElements = container.querySelectorAll("mesh");
      expect(meshElements.length).toBeGreaterThan(0);
    });
  });

  it("does not render a <primitive> element while loading", async () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Promise<void>(() => {});
    });

    const { container } = render(
      <Suspense fallback={null}>
        <OfficeAsset entry={deskEntry} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(container.querySelector("primitive")).toBeNull();
    });
  });

  it("does not crash when useGLTF suspends", () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Promise<void>(() => {});
    });

    expect(() =>
      render(
        <Suspense fallback={null}>
          <OfficeAsset entry={deskEntry} />
        </Suspense>,
      ),
    ).not.toThrow();
  });
});

describe("OfficeAsset — success state (mocked GLB content)", () => {
  it("renders a <primitive> element when useGLTF returns successfully", async () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    const { container } = render(<OfficeAsset entry={deskEntry} />);

    await waitFor(() => {
      expect(container.querySelector("primitive")).not.toBeNull();
    });
  });

  it("calls useGLTF with the manifest URL, not an external URL", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deskEntry} />);

    expect(mockUseGLTF).toHaveBeenCalledWith(deskEntry.url);
  });

  it("calls useGLTF with a /assets/office/ path (never an external host)", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deviceEntry} />);

    const calledUrl: string = mockUseGLTF.mock.calls[0][0];
    expect(calledUrl).toMatch(/^\/assets\/office\//);
    expect(calledUrl).not.toMatch(/^https?:\/\//);
  });

  it("does not render the fallback <mesh> when the asset loads successfully", async () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    const { container } = render(<OfficeAsset entry={deskEntry} />);

    await waitFor(() => {
      const primitive = container.querySelector("primitive");
      expect(primitive).not.toBeNull();
    });

    // The fallback mesh should not co-exist with the loaded primitive
    expect(container.querySelector("mesh")).toBeNull();
  });

  it("calls scene.clone() so the same asset can be mounted multiple times", () => {
    const { scene } = makeSuccessScene();
    mockUseGLTF.mockReturnValue({ scene });

    render(<OfficeAsset entry={deskEntry} />);

    expect(scene.clone).toHaveBeenCalledOnce();
  });

  it("renders without crashing for every manifest category", () => {
    for (const entry of [deskEntry, deviceEntry, containerEntry, clutterEntry]) {
      mockUseGLTF.mockReturnValue(makeSuccessScene());
      expect(() => render(<OfficeAsset entry={entry} />)).not.toThrow();
      mockUseGLTF.mockReset();
    }
  });
});

describe("OfficeAsset — error state (failed load fallback)", () => {
  it("renders the fallback mesh when useGLTF throws an Error", async () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Error("GLB file not found: 404");
    });

    const { container } = render(<OfficeAsset entry={deskEntry} />);

    await waitFor(() => {
      const meshElements = container.querySelectorAll("mesh");
      expect(meshElements.length).toBeGreaterThan(0);
    });
  });

  it("does not propagate the load error to parent (ErrorBoundary isolates it)", () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Error("Simulated GLB parse failure");
    });

    // If the ErrorBoundary leaks, render would throw
    expect(() => render(<OfficeAsset entry={deskEntry} />)).not.toThrow();
  });

  it("does not render a <primitive> element after a load error", async () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Error("Asset unavailable");
    });

    const { container } = render(<OfficeAsset entry={deskEntry} />);

    // Give React time to commit the error boundary render
    await waitFor(() => {
      expect(container.querySelector("primitive")).toBeNull();
    });
  });

  it("renders the same fallback for device entry on load error", async () => {
    mockUseGLTF.mockImplementation(() => {
      throw new Error("File not found");
    });

    const { container } = render(<OfficeAsset entry={deviceEntry} />);

    await waitFor(() => {
      expect(container.querySelector("mesh")).not.toBeNull();
    });
  });
});

describe("OfficeAsset — transform props", () => {
  it("renders without crashing when position override is provided", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    expect(() =>
      render(<OfficeAsset entry={deskEntry} position={[3, 0, -1]} />),
    ).not.toThrow();
  });

  it("renders without crashing when rotation override is provided (radians)", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    expect(() =>
      render(<OfficeAsset entry={deskEntry} rotation={[0, Math.PI / 2, 0]} />),
    ).not.toThrow();
  });

  it("renders without crashing when scale override is provided", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    expect(() =>
      render(<OfficeAsset entry={deskEntry} scale={[2, 2, 2]} />),
    ).not.toThrow();
  });

  it("renders without crashing when no transform overrides are provided (uses manifest defaults)", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    expect(() => render(<OfficeAsset entry={deskEntry} />)).not.toThrow();
  });
});

describe("OfficeAsset — URL safety (no external hosts)", () => {
  it("does not request Poly Pizza URLs at runtime", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deskEntry} />);

    const calledUrl: string = mockUseGLTF.mock.calls[0][0];
    expect(calledUrl).not.toContain("poly.pizza");
  });

  it("does not request itch.io URLs at runtime", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deskEntry} />);

    const calledUrl: string = mockUseGLTF.mock.calls[0][0];
    expect(calledUrl).not.toContain("itch.io");
  });

  it("uses the manifest entry URL verbatim (no mutation)", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deskEntry} />);

    expect(mockUseGLTF).toHaveBeenCalledWith("/assets/office/office-desk.glb");
  });

  it("uses the correct URL for a device entry", () => {
    mockUseGLTF.mockReturnValue(makeSuccessScene());

    render(<OfficeAsset entry={deviceEntry} />);

    expect(mockUseGLTF).toHaveBeenCalledWith("/assets/office/office-monitor.glb");
  });
});
