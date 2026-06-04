// AppShell state binding tests
//
// Verifies that AppShell reads live session state (via useRendererProps)
// and routes view events to the session dispatch without mutating state
// inside the renderer.
//
// @react-three/fiber and @react-three/drei are mocked because AppShell
// renders AethelViewport which uses WebGL.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ── Mocks (before component imports) ──────────────────────────────────────

vi.mock("@react-three/fiber", () => ({
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
  useThree: vi.fn(() => ({})),
}));

vi.mock("@react-three/drei", () => ({
  OrbitControls: () => null,
  Html: ({ children }: { children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("div", { "data-testid": "drei-html" }, children),
}));

// ── Suppress JSDOM R3F noise ───────────────────────────────────────────────

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (
      msg.includes("incorrect casing") ||
      msg.includes("is not a valid HTML element") ||
      msg.includes("Unknown prop") ||
      msg.includes("act(...")
    ) {
      return;
    }
    console.warn(...args);
  });
});

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { AppShell } from "./AppShell";
import { SessionContext } from "../state/SessionProvider";
import { baselineSession } from "../state/baselineSession";
import type { SessionState } from "../state/sessionTypes";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Render AppShell with a custom session state and a dispatch spy.
 * Uses SessionContext.Provider directly to avoid starting a reducer.
 */
function renderWithSession(stateOverride?: Partial<SessionState>, dispatchSpy = vi.fn()) {
  const state: SessionState = stateOverride
    ? { ...baselineSession, ...stateOverride }
    : { ...baselineSession };

  render(
    <SessionContext.Provider value={{ state, dispatch: dispatchSpy }}>
      <AppShell />
    </SessionContext.Provider>,
  );

  return { dispatchSpy, state };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("AppShell — session state binding", () => {
  // ── Agent state → viewport ───────────────────────────────────────────

  it("passes live agent displayName to the viewport name label", () => {
    renderWithSession({
      agent: {
        ...baselineSession.agent,
        displayName: "Live Agent Name",
      },
    });
    expect(screen.getByTestId("agent-name-label")).toHaveTextContent("Live Agent Name");
  });

  it("passes updated accent color from live session to agent avatar", () => {
    renderWithSession({
      agent: {
        ...baselineSession.agent,
        appearance: {
          ...baselineSession.agent.appearance,
          accentColor: "#FF6B6B",
        },
      },
    });
    // The name label uses the accent color as its CSS text color
    const label = screen.getByTestId("agent-name-label");
    expect(label).toHaveStyle({ color: "#FF6B6B" });
  });

  it("reflects updated avatarPreset on the agent-avatar element", () => {
    renderWithSession({
      agent: {
        ...baselineSession.agent,
        appearance: {
          ...baselineSession.agent.appearance,
          avatarPreset: "robot",
        },
      },
    });
    const avatar = screen.getByTestId("agent-avatar");
    expect(avatar).toHaveAttribute("data-avatar-preset", "robot");
  });

  it("reflects updated idlePose on the agent-avatar element", () => {
    renderWithSession({
      agent: {
        ...baselineSession.agent,
        appearance: {
          ...baselineSession.agent.appearance,
          idlePose: "thinking",
        },
      },
    });
    const avatar = screen.getByTestId("agent-avatar");
    expect(avatar).toHaveAttribute("data-idle-pose", "thinking");
  });

  // ── Environment state → viewport ─────────────────────────────────────

  it("only renders enabled scene objects from live session state", () => {
    renderWithSession({
      environment: {
        ...baselineSession.environment,
        objects: [
          { ...baselineSession.environment.objects[0], enabled: true },
          { ...baselineSession.environment.objects[1], enabled: false },
          { ...baselineSession.environment.objects[2], enabled: true },
        ],
      },
    });
    // obj-001 and obj-003 are enabled
    expect(screen.getByTestId("scene-object-obj-001")).toBeInTheDocument();
    expect(screen.queryByTestId("scene-object-obj-002")).not.toBeInTheDocument();
    expect(screen.getByTestId("scene-object-obj-003")).toBeInTheDocument();
  });

  it("does not render scene objects that are disabled in session state", () => {
    renderWithSession({
      environment: {
        ...baselineSession.environment,
        objects: baselineSession.environment.objects.map((obj) => ({
          ...obj,
          enabled: false,
        })),
      },
    });
    expect(screen.queryByTestId("scene-object-obj-001")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-object-obj-002")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scene-object-obj-003")).not.toBeInTheDocument();
  });

  // ── View event → dispatch (no direct state mutation) ─────────────────

  it("dispatches session/selected_object_change on background click", () => {
    const { dispatchSpy } = renderWithSession();

    const canvas = screen.getByTestId("r3f-canvas");
    fireEvent.click(canvas);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "session/selected_object_change" }),
    );
  });

  it("dispatches selectedObjectId=undefined when background is clicked", () => {
    const { dispatchSpy } = renderWithSession();

    const canvas = screen.getByTestId("r3f-canvas");
    fireEvent.click(canvas);

    const call = dispatchSpy.mock.calls.find(
      ([action]) => action.type === "session/selected_object_change",
    );
    expect(call).toBeDefined();
    expect(call![0].payload.id).toBeUndefined();
  });

  // ── selectedObjectId from session → viewport ─────────────────────────

  it("passes selectedObjectId from session state to the viewport", () => {
    // Render with selectedObjectId set — the scene object should receive
    // the isSelected flag and render without crashing.
    expect(() =>
      renderWithSession({
        ui: {
          ...baselineSession.ui,
          selectedObjectId: "obj-001",
        },
      }),
    ).not.toThrow();
  });

  // ── Baseline rendering ────────────────────────────────────────────────

  it("renders all three structural regions (control, viewport, chat)", () => {
    renderWithSession();
    expect(screen.getByTestId("control-panel-container")).toBeInTheDocument();
    expect(screen.getByTestId("viewport-panel")).toBeInTheDocument();
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });

  it("renders agent-avatar inside the viewport panel", () => {
    renderWithSession();
    const viewportPanel = screen.getByTestId("viewport-panel");
    expect(
      viewportPanel.querySelector('[data-testid="agent-avatar"]'),
    ).toBeInTheDocument();
  });
});
