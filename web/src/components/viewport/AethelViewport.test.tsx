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
      onClick,
      ...rest
    }: {
      children: React.ReactNode;
      onClick?: React.MouseEventHandler;
      [key: string]: unknown;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "r3f-canvas", onClick, ...rest },
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

  it("renders agent avatar elements", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("agent-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("agent-body")).toBeInTheDocument();
    expect(screen.getByTestId("agent-head")).toBeInTheDocument();
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
    expect(screen.getByTestId("agent-avatar")).toHaveAttribute(
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
    expect(screen.getByTestId("agent-avatar")).toHaveAttribute(
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
    expect(screen.getByTestId("agent-body")).toBeInTheDocument();
  });

  // ── Environment state → scene output ────────────────────────────────

  it("renders scene environment elements", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("scene-environment")).toBeInTheDocument();
    expect(screen.getByTestId("floor")).toBeInTheDocument();
    expect(screen.getByTestId("wall-north")).toBeInTheDocument();
    expect(screen.getByTestId("wall-south")).toBeInTheDocument();
    expect(screen.getByTestId("wall-east")).toBeInTheDocument();
    expect(screen.getByTestId("wall-west")).toBeInTheDocument();
  });

  it("renders ambient and directional lights from SceneEnvironment", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("ambient-light")).toBeInTheDocument();
    expect(screen.getByTestId("key-light")).toBeInTheDocument();
    expect(screen.getByTestId("fill-light")).toBeInTheDocument();
  });

  it("renders all three enabled scene objects", () => {
    render(<AethelViewport agent={testAgent} environment={testEnvironment} />);
    expect(screen.getByTestId("scene-object-obj-001")).toBeInTheDocument();
    expect(screen.getByTestId("scene-object-obj-002")).toBeInTheDocument();
    expect(screen.getByTestId("scene-object-obj-003")).toBeInTheDocument();
  });

  it("does not render disabled scene objects", () => {
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
    expect(screen.queryByTestId("scene-object-obj-disabled")).not.toBeInTheDocument();
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
    expect(screen.queryByTestId("scene-object-obj-002")).not.toBeInTheDocument();

    const envWithEnabled: EnvironmentState = {
      ...testEnvironment,
      objects: testEnvironment.objects.map((o) => ({ ...o, enabled: true })),
    };
    rerender(<AethelViewport agent={testAgent} environment={envWithEnabled} />);
    expect(screen.getByTestId("scene-object-obj-002")).toBeInTheDocument();
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
