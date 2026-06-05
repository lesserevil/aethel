// Tests for AethelViewport
//
// jsdom does not support WebGL, so we mock @react-three/fiber Canvas and
// @react-three/drei helpers. The mocks render children in plain div containers
// so the React component tree can be exercised without a GPU.
//
// What we verify:
//   - Component mounts without throwing
//   - Wrapper div carries data-testid and data-viewport-ready attribute
//   - onReady callback fires after mount
//   - onViewEvent is forwarded from scene interactions
//   - The agent's displayName appears in the scene
//   - Agent appearance changes (avatarPreset, idlePose, accentColor) are reflected
//   - Environment state is passed through to SceneEnvironment
//   - Viewport does NOT mutate state — only emits events via onViewEvent

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@react-three/fiber", () => {
  return {
    Canvas: ({
      children,
      onPointerMissed,
      onClick,
      ...rest
    }: {
      children: React.ReactNode;
      onPointerMissed?: React.MouseEventHandler;
      onClick?: React.MouseEventHandler;
      [key: string]: unknown;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "r3f-canvas",
          // Map onPointerMissed (R3F background-click event) to onClick on the
          // mock div so unit tests can trigger background-click by calling
          // canvas.click(). Falls back to onClick for legacy compatibility.
          onClick: onPointerMissed ?? onClick,
          ...rest,
        },
        children,
      ),
    useFrame: vi.fn(),
    useThree: vi.fn(() => ({ camera: {}, scene: {}, gl: {} })),
  };
});

vi.mock("@react-three/drei", () => {
  return {
    OrbitControls: () => null,
    Html: ({ children }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement("div", { "data-testid": "drei-html" }, children),
  };
});

// ── Fixtures ───────────────────────────────────────────────────────────────

import type { AgentState, EnvironmentState } from "../../state/sessionTypes";

const testAgent: AgentState = {
  id: "agent-test-001",
  displayName: "Test Agent",
  personaPreset: "helpful",
  tone: "friendly",
  behavior: { curiosity: 0.5, formality: 0.5, skepticism: 0.5 },
  appearance: {
    avatarPreset: "humanoid",
    accentColor: "#4CC9F0",
    idlePose: "standing",
  },
};

const testEnvironment: EnvironmentState = {
  preset: "laboratory",
  timeOfDay: "day",
  lighting: "bright",
  ambience: "peaceful",
  weather: "clear",
  objects: [
    {
      id: "obj-001",
      label: "Workstation",
      type: "desk",
      enabled: true,
      position: { x: -2, y: 0, z: 0 },
    },
    {
      id: "obj-002",
      label: "Display Screen",
      type: "monitor",
      enabled: true,
      position: { x: 0, y: 1.5, z: -1 },
    },
    {
      id: "obj-003",
      label: "Storage Unit",
      type: "cabinet",
      enabled: true,
      position: { x: 2, y: 0, z: 0 },
    },
  ],
};

// ── Import under test (after mocks) ────────────────────────────────────────
import { AethelViewport } from "./AethelViewport";

// ── Suppress JSDOM console noise from unrecognised Three.js element names ──
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    // Suppress React unknown DOM element warnings from R3F primitives
    if (
      msg.includes("ambientLight") ||
      msg.includes("directionalLight") ||
      msg.includes("mesh") ||
      msg.includes("planeGeometry") ||
      msg.includes("boxGeometry") ||
      msg.includes("sphereGeometry") ||
      msg.includes("cylinderGeometry") ||
      msg.includes("meshStandardMaterial") ||
      msg.includes("group") ||
      msg.includes("orbitControls") ||
      // filter general "Unknown prop" React warnings for custom elements
      msg.includes("is not a valid HTML element") ||
      msg.includes("Unknown prop")
    ) {
      return;
    }
    // Let other errors through
    console.warn(...args);
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("AethelViewport", () => {
  // ── Mount and basic structure ────────────────────────────────────────

  it("renders without crashing", () => {
    expect(() =>
      render(<AethelViewport agent={testAgent} environment={testEnvironment} />),
    ).not.toThrow();
  });

  it('renders wrapper div with data-testid="aethel-viewport"', () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("aethel-viewport")).toBeInTheDocument();
  });

  it('starts with data-viewport-ready="false" and transitions to "true"', async () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    const wrapper = screen.getByTestId("aethel-viewport");

    // Eventually the ready signal should fire (via Promise.resolve microtask)
    await waitFor(() => {
      expect(wrapper).toHaveAttribute("data-viewport-ready", "true");
    });
  });

  it("calls onReady once after mount", async () => {
    const onReady = vi.fn();
    render(
      <AethelViewport
        agent={testAgent}
        environment={testEnvironment}
        onReady={onReady}
      />,
    );

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });
  });

  it("renders the R3F Canvas container", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
  });

  // ── Agent appearance state → visible output ──────────────────────────

  it("renders agent name label with displayName", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("agent-name-label")).toHaveTextContent("Test Agent");
  });

  it("renders updated displayName when agent prop changes", () => {
    const { rerender } = render(
      <AethelViewport agent={testAgent} environment={testEnvironment} />,
    );
    rerender(
      <AethelViewport
        agent={{ ...testAgent, displayName: "Updated Agent" }}
        environment={testEnvironment}
      />,
    );
    expect(screen.getByTestId("agent-name-label")).toHaveTextContent("Updated Agent");
  });

  it("renders agent avatar elements (agent name label visible)", () => {
    // Three.js/R3F primitives (<group>, <mesh>, etc.) do not support data-testid
    // in real Chrome — querying by the agent name label (rendered via Html overlay)
    // and the viewport wrapper div attributes is the correct approach.
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    // The r3f-canvas mock wraps all scene children — verifies scene renders
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    // Agent name label is an HTML element and is accessible via data-testid
    expect(screen.getByTestId("agent-name-label")).toBeInTheDocument();
    // Viewport wrapper carries avatar state as data attributes
    const viewport = screen.getByTestId("aethel-viewport");
    expect(viewport).toHaveAttribute("data-avatar-preset");
    expect(viewport).toHaveAttribute("data-idle-pose");
  });

  it("reflects avatarPreset on agent-avatar data attribute", () => {
    render(
      <AethelViewport
        agent={{
          ...testAgent,
          appearance: { ...testAgent.appearance, avatarPreset: "robot" },
        }}
        environment={testEnvironment}
      />,
    );
    // The viewport wrapper div exposes agent appearance state as data attributes
    // so tests can verify state without querying Three.js scene objects.
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-avatar-preset",
      "robot",
    );
    // The name label (Html overlay) also carries the attribute
    expect(screen.getByTestId("agent-name-label")).toHaveAttribute(
      "data-avatar-preset",
      "robot",
    );
  });

  it("reflects idlePose on agent-avatar data attribute", () => {
    render(
      <AethelViewport
        agent={{
          ...testAgent,
          appearance: { ...testAgent.appearance, idlePose: "thinking" },
        }}
        environment={testEnvironment}
      />,
    );
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-idle-pose",
      "thinking",
    );
    expect(screen.getByTestId("agent-name-label")).toHaveAttribute(
      "data-idle-pose",
      "thinking",
    );
  });

  it("applies accent color from agent state to the name label", () => {
    render(
      <AethelViewport
        agent={{
          ...testAgent,
          appearance: { ...testAgent.appearance, accentColor: "#FF6B6B" },
        }}
        environment={testEnvironment}
      />,
    );
    const label = screen.getByTestId("agent-name-label");
    expect(label).toHaveStyle({ color: "#FF6B6B" });
  });

  it("renders abstract avatarPreset without crashing (sphere body)", () => {
    expect(() =>
      render(
        <AethelViewport
          agent={{
            ...testAgent,
            appearance: { ...testAgent.appearance, avatarPreset: "abstract" },
          }}
          environment={testEnvironment}
        />,
      ),
    ).not.toThrow();
    // Verify the viewport wrapper reflects the abstract avatar preset
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-avatar-preset",
      "abstract",
    );
  });

  // ── Environment state → scene output ────────────────────────────────

  it("renders scene environment elements (R3F canvas is present)", () => {
    // Three.js/R3F scene objects (floor, walls, lights) do not have HTML
    // data-testid attributes — they are Three.js objects not DOM elements.
    // We verify the scene renders by confirming the R3F canvas mock is present
    // and the viewport carries the expected environment-preset data attribute.
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-environment-preset",
      testEnvironment.preset,
    );
  });

  it("exposes time-of-day from environment state as data-time-of-day attribute", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-time-of-day",
      testEnvironment.timeOfDay,
    );
  });

  it("exposes lighting from environment state as data-lighting attribute", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-lighting",
      testEnvironment.lighting,
    );
  });

  it("reflects updated timeOfDay when environment prop changes", () => {
    const { rerender } = render(
      <AethelViewport agent={testAgent} environment={testEnvironment} />,
    );
    rerender(
      <AethelViewport
        agent={testAgent}
        environment={{ ...testEnvironment, timeOfDay: "night" }}
      />,
    );
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-time-of-day",
      "night",
    );
  });

  it("reflects updated lighting when environment prop changes", () => {
    const { rerender } = render(
      <AethelViewport agent={testAgent} environment={testEnvironment} />,
    );
    rerender(
      <AethelViewport
        agent={testAgent}
        environment={{ ...testEnvironment, lighting: "dramatic" }}
      />,
    );
    expect(screen.getByTestId("aethel-viewport")).toHaveAttribute(
      "data-lighting",
      "dramatic",
    );
  });

  it("renders lights from SceneEnvironment (R3F canvas is present)", () => {
    // Lighting is Three.js-internal; we verify the full scene renders by
    // confirming the R3F canvas is in the tree without errors.
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
  });

  it("renders all three enabled scene objects (reflected in data-enabled-objects)", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    // The viewport wrapper carries a comma-separated list of enabled object IDs.
    const viewport = screen.getByTestId("aethel-viewport");
    const enabledObjects = viewport.getAttribute("data-enabled-objects") ?? "";
    expect(enabledObjects).toContain("obj-001");
    expect(enabledObjects).toContain("obj-002");
    expect(enabledObjects).toContain("obj-003");
  });

  it("does not render disabled scene objects (absent from data-enabled-objects)", () => {
    const envWithDisabled: EnvironmentState = {
      ...testEnvironment,
      objects: [
        ...testEnvironment.objects,
        {
          id: "obj-disabled",
          label: "Hidden Object",
          type: "chair",
          enabled: false,
        },
      ],
    };
    render(<AethelViewport agent={testAgent} environment={envWithDisabled} />);
    const viewport = screen.getByTestId("aethel-viewport");
    const enabledObjects = viewport.getAttribute("data-enabled-objects") ?? "";
    expect(enabledObjects).not.toContain("obj-disabled");
    // Enabled objects still present
    expect(enabledObjects).toContain("obj-001");
  });

  it("shows previously disabled object when environment prop updates to enable it", () => {
    const envWithDisabled: EnvironmentState = {
      ...testEnvironment,
      objects: testEnvironment.objects.map((o) =>
        o.id === "obj-002" ? { ...o, enabled: false } : o,
      ),
    };
    const { rerender } = render(
      <AethelViewport agent={testAgent} environment={envWithDisabled} />,
    );
    const viewport = screen.getByTestId("aethel-viewport");
    expect(viewport.getAttribute("data-enabled-objects") ?? "").not.toContain("obj-002");

    const envWithEnabled: EnvironmentState = {
      ...testEnvironment,
      objects: testEnvironment.objects.map((o) => ({ ...o, enabled: true })),
    };
    rerender(<AethelViewport agent={testAgent} environment={envWithEnabled} />);
    expect(viewport.getAttribute("data-enabled-objects") ?? "").toContain("obj-002");
  });

  // ── View events (no direct state mutation) ───────────────────────────

  it("forwards onViewEvent for background clicks", () => {
    const onViewEvent = vi.fn();
    render(
      <AethelViewport
        agent={testAgent}
        environment={testEnvironment}
        onViewEvent={onViewEvent}
      />,
    );

    // The Canvas mock receives the onClick prop — simulate a click on the canvas
    const canvas = screen.getByTestId("r3f-canvas");
    canvas.click();

    expect(onViewEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "background-click" }),
    );
  });

  it("accepts selectedObjectId prop without crashing", () => {
    expect(() =>
      render(
        <AethelViewport
          agent={testAgent}
          environment={testEnvironment}
          selectedObjectId="obj-001"
        />,
      ),
    ).not.toThrow();
  });

  it("does not crash when onViewEvent is not provided", () => {
    expect(() =>
      render(<AethelViewport agent={testAgent} environment={testEnvironment} />),
    ).not.toThrow();
  });
});
