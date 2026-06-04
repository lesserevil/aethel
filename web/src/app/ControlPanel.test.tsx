import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentControlPanel as ControlPanel } from "./ControlPanel";
import { SessionContext } from "../state/SessionProvider";
import { baselineSession } from "../state/baselineSession";
import { SessionState } from "../state/sessionTypes";

// Helper: render ControlPanel with a specific session state and a spy on dispatch
function renderWithSpy(stateOverride?: Partial<SessionState>) {
  const dispatchSpy = vi.fn();
  const state: SessionState = stateOverride
    ? { ...baselineSession, ...stateOverride }
    : { ...baselineSession };

  render(
    <SessionContext.Provider value={{ state, dispatch: dispatchSpy }}>
      <ControlPanel />
    </SessionContext.Provider>,
  );

  return { dispatchSpy };
}

// Helper: render ControlPanel with a read-only session (no dispatch tracking needed)
function renderWithState(stateOverride?: Partial<SessionState>) {
  const state: SessionState = { ...baselineSession, ...stateOverride };
  render(
    <SessionContext.Provider value={{ state, dispatch: () => undefined }}>
      <ControlPanel />
    </SessionContext.Provider>,
  );
}

describe("ControlPanel", () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders the agent control panel section", () => {
    renderWithState();
    expect(screen.getByTestId("agent-control-panel")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /agent controls/i })).toBeInTheDocument();
  });

  it("renders all identity controls", () => {
    renderWithState();
    expect(screen.getByTestId("agent-display-name-input")).toBeInTheDocument();
    expect(screen.getByTestId("agent-persona-select")).toBeInTheDocument();
    expect(screen.getByTestId("agent-tone-select")).toBeInTheDocument();
  });

  it("renders all behavior sliders", () => {
    renderWithState();
    expect(screen.getByLabelText(/curiosity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/formality/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/skepticism/i)).toBeInTheDocument();
  });

  it("renders appearance controls", () => {
    renderWithState();
    expect(screen.getByTestId("agent-idle-pose-select")).toBeInTheDocument();
    expect(screen.getByTestId("accent-color-swatches")).toBeInTheDocument();
    // Avatar segmented control buttons
    expect(screen.getByTestId("avatar-preset-humanoid")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-preset-robot")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-preset-abstract")).toBeInTheDocument();
  });

  it("renders the Apply Agent Changes button", () => {
    renderWithState();
    expect(screen.getByTestId("apply-agent-changes-btn")).toBeInTheDocument();
  });

  // ── Initial values reflect baseline agent state ───────────────────────

  it("populates display name from session state", () => {
    renderWithState();
    const input = screen.getByTestId("agent-display-name-input") as HTMLInputElement;
    expect(input.value).toBe("Aethel Agent");
  });

  it("populates persona preset from session state", () => {
    renderWithState();
    const select = screen.getByTestId("agent-persona-select") as HTMLSelectElement;
    expect(select.value).toBe("helpful");
  });

  it("marks the current avatar preset button as active (aria-pressed)", () => {
    renderWithState();
    expect(screen.getByTestId("avatar-preset-humanoid")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("avatar-preset-robot")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("marks the current accent color swatch as active", () => {
    renderWithState();
    const cyanSwatch = screen.getByTestId("accent-color-cyan");
    expect(cyanSwatch).toHaveAttribute("aria-pressed", "true");
  });

  // ── Draft state: edits do NOT directly update shared state ───────────

  it("editing display name updates draft but does not dispatch until Apply", () => {
    const { dispatchSpy } = renderWithSpy();
    const input = screen.getByTestId("agent-display-name-input");
    fireEvent.change(input, { target: { value: "New Name" } });
    // No dispatch yet
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe("New Name");
  });

  it("selecting a different persona updates draft but does not dispatch until Apply", () => {
    const { dispatchSpy } = renderWithSpy();
    const select = screen.getByTestId("agent-persona-select");
    fireEvent.change(select, { target: { value: "analytical" } });
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("moving a slider updates the displayed percentage without dispatching", () => {
    const { dispatchSpy } = renderWithSpy();
    const curiositySlider = screen.getByLabelText(/curiosity/i);
    fireEvent.change(curiositySlider, { target: { value: "1" } });
    expect(dispatchSpy).not.toHaveBeenCalled();
    // Percentage label should update
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clicking an avatar preset button updates draft without dispatching", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("avatar-preset-robot"));
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("avatar-preset-robot")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("avatar-preset-humanoid")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("clicking an accent color swatch updates draft without dispatching", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("accent-color-violet"));
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("accent-color-violet")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  // ── Apply flow ────────────────────────────────────────────────────────

  it("dispatches exactly 3 actions on a valid Apply (agent update + mutation + chat message)", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy).toHaveBeenCalledTimes(3);
  });

  it("first dispatch is a session/agent_full_change action", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    const [firstCall] = dispatchSpy.mock.calls;
    expect(firstCall[0].type).toBe("session/agent_full_change");
  });

  it("second dispatch is a session/mutation_append action", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    const [, secondCall] = dispatchSpy.mock.calls;
    expect(secondCall[0].type).toBe("session/mutation_append");
  });

  it("third dispatch is a session/chat_append action with sender=system", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    const [, , thirdCall] = dispatchSpy.mock.calls;
    expect(thirdCall[0].type).toBe("session/chat_append");
    expect(thirdCall[0].payload.message.sender).toBe("system");
  });

  it("mutation record has source=control-panel, target=agent, and status=applied", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    const [, secondCall] = dispatchSpy.mock.calls;
    const mutation = secondCall[0].payload.mutation;
    expect(mutation.source).toBe("control-panel");
    expect(mutation.target).toBe("agent");
    expect(mutation.status).toBe("applied");
  });

  it("agent_full_change payload includes the edited display name", () => {
    const { dispatchSpy } = renderWithSpy();
    const input = screen.getByTestId("agent-display-name-input");
    fireEvent.change(input, { target: { value: "Edited Agent" } });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    const [firstCall] = dispatchSpy.mock.calls;
    expect(firstCall[0].payload.displayName).toBe("Edited Agent");
  });

  it("agent_full_change payload includes the edited persona preset", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("agent-persona-select"), {
      target: { value: "creative" },
    });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy.mock.calls[0][0].payload.personaPreset).toBe("creative");
  });

  it("agent_full_change payload includes the edited tone", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("agent-tone-select"), {
      target: { value: "casual" },
    });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy.mock.calls[0][0].payload.tone).toBe("casual");
  });

  it("agent_full_change payload includes updated behavior values", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByLabelText(/curiosity/i), { target: { value: "0.9" } });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy.mock.calls[0][0].payload.behavior.curiosity).toBe(0.9);
  });

  it("shows apply status message after successful apply", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(screen.getByTestId("agent-apply-status")).toBeInTheDocument();
    // Silence unused variable warning
    void dispatchSpy;
  });

  // ── Validation ────────────────────────────────────────────────────────

  it("shows validation error and does NOT dispatch if display name is empty", () => {
    const { dispatchSpy } = renderWithSpy();
    const input = screen.getByTestId("agent-display-name-input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("agent-validation-error")).toBeInTheDocument();
  });

  it("clears validation error after fixing the display name", () => {
    const { dispatchSpy } = renderWithSpy();
    const input = screen.getByTestId("agent-display-name-input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(screen.getByTestId("agent-validation-error")).toBeInTheDocument();
    // Fix the name — error should clear on next keystroke
    fireEvent.change(input, { target: { value: "Valid Name" } });
    expect(screen.queryByTestId("agent-validation-error")).not.toBeInTheDocument();
    // Silence unused variable warning
    void dispatchSpy;
  });

  it("shows validation error if display name exceeds 50 characters and does NOT dispatch", () => {
    const { dispatchSpy } = renderWithSpy();
    const longName = "A".repeat(51);
    const input = screen.getByTestId("agent-display-name-input") as HTMLInputElement;
    // Override maxLength so the test input can carry the long value
    Object.defineProperty(input, "maxLength", { value: 200, configurable: true });
    fireEvent.change(input, { target: { value: longName } });
    fireEvent.click(screen.getByTestId("apply-agent-changes-btn"));
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("agent-validation-error")).toBeInTheDocument();
  });

  // ── Layout: long display names ────────────────────────────────────────

  it("renders without layout breakage when display name is at maximum length (50 chars)", () => {
    const longName = "A".repeat(50);
    renderWithState({
      agent: { ...baselineSession.agent, displayName: longName },
    });
    const input = screen.getByTestId("agent-display-name-input") as HTMLInputElement;
    expect(input.value).toBe(longName);
    // maxLength attribute must cap at 50 to guard layout
    expect(input.maxLength).toBe(50);
  });

  // ── Group structure ───────────────────────────────────────────────────

  it("renders identity, behavior, and appearance control groups", () => {
    renderWithState();
    expect(screen.getByTestId("agent-identity-group")).toBeInTheDocument();
    expect(screen.getByTestId("agent-behavior-group")).toBeInTheDocument();
    expect(screen.getByTestId("agent-appearance-group")).toBeInTheDocument();
  });
});
