// App shell layout tests
// @react-three/fiber and @react-three/drei are mocked because AppShell now
// renders AethelViewport (which uses WebGL), and jsdom has no WebGL support.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ── Mocks must be declared before any component imports ─────────────────────

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

// ── Suppress JSDOM R3F unknown-element noise ─────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

import { AppShell } from "./app/AppShell";

describe("AppShell", () => {
  it("renders the control panel container", () => {
    render(<AppShell />);
    // The outer aside wrapper (control-panel-container) holds the ControlPanel component.
    // The ControlPanel component itself carries data-testid="control-panel".
    expect(screen.getByTestId("control-panel-container")).toBeInTheDocument();
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
  });

  it("renders the viewport panel", () => {
    render(<AppShell />);
    expect(screen.getByTestId("viewport-panel")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /3d viewport/i })).toBeInTheDocument();
  });

  it("renders the chat panel", () => {
    render(<AppShell />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /chat panel/i })).toBeInTheDocument();
  });

  it("renders the AethelViewport inside the viewport panel", () => {
    render(<AppShell />);
    const viewportPanel = screen.getByTestId("viewport-panel");
    expect(
      viewportPanel.querySelector('[data-testid="aethel-viewport"]'),
    ).toBeInTheDocument();
  });
});
