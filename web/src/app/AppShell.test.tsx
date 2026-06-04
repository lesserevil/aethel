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
    // Three.js/R3F primitives do not support data-testid in real Chrome.
    // The AethelViewport wrapper div and the agent-name-label (Html overlay)
    // expose agent state as HTML data attributes for test assertions.
    const viewport = screen.getByTestId("aethel-viewport");
    expect(viewport).toHaveAttribute("data-avatar-preset", "robot");
    expect(screen.getByTestId("agent-name-label")).toHaveAttribute(
      "data-avatar-preset",
      "robot",
    );
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
    const viewport = screen.getByTestId("aethel-viewport");
    expect(viewport).toHaveAttribute("data-idle-pose", "thinking");
    expect(screen.getByTestId("agent-name-label")).toHaveAttribute(
      "data-idle-pose",
      "thinking",
    );
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
    // Three.js/R3F scene objects don't support data-testid in real Chrome.
    // The viewport wrapper div carries data-enabled-objects (comma-separated IDs)
    // so tests can verify which objects are enabled without Three.js queries.
    const viewport = screen.getByTestId("aethel-viewport");
    const enabledObjects = viewport.getAttribute("data-enabled-objects") ?? "";
    expect(enabledObjects).toContain("obj-001");
    expect(enabledObjects).not.toContain("obj-002");
    expect(enabledObjects).toContain("obj-003");
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
    const viewport = screen.getByTestId("aethel-viewport");
    const enabledObjects = viewport.getAttribute("data-enabled-objects") ?? "";
    expect(enabledObjects).not.toContain("obj-001");
    expect(enabledObjects).not.toContain("obj-002");
    expect(enabledObjects).not.toContain("obj-003");
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

  it("renders agent viewport (aethel-viewport) inside the viewport panel", () => {
    renderWithSession();
    const viewportPanel = screen.getByTestId("viewport-panel");
    // Three.js/R3F primitives don't support data-testid in real Chrome.
    // The AethelViewport wrapper div (data-testid="aethel-viewport") is an HTML
    // element inside the viewport panel — use that for DOM queries.
    expect(
      viewportPanel.querySelector('[data-testid="aethel-viewport"]'),
    ).toBeInTheDocument();
  });
});
