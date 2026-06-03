import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app/AppShell";

describe("AppShell", () => {
  it("renders the control panel", () => {
    render(<AppShell />);
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /control panel/i })).toBeInTheDocument();
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
});
