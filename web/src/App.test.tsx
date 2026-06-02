import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the Aethel heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /aethel/i })).toBeInTheDocument();
  });

  it("renders the placeholder message", () => {
    render(<App />);
    expect(screen.getByText(/three-column shell coming soon/i)).toBeInTheDocument();
  });
});
