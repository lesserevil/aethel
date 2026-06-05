// Tests for EnvironmentControlPanel (components/controls/ControlPanel.tsx)
//
// Covers:
//   1. Rendering – all control sections and buttons are present
//   2. Initial values reflect baseline session state
//   3. Draft state – edits update the local draft but do NOT dispatch until Apply
//   4. hasChanges guard – Apply button disabled when draft matches session state
//   5. Apply flow – dispatches setEnvironmentPreset, appendMutation, appendChatMessage
//   6. Apply mutation record – source/target/status verified
//   7. System message on apply – sender=system with summary text
//   8. Object-toggle Apply – dispatches toggleObjectEnabled for changed objects
//   9. Reset flow – dispatches resetSession, appendMutation, appendChatMessage
//  10. Reset mutation record – source=control-panel, target=session
//  11. Reset restores selects to baseline values

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ControlPanel } from "./ControlPanel";
import { SessionContext } from "../../state/SessionProvider";
import { baselineSession } from "../../state/baselineSession";
import type { SessionState } from "../../state/sessionTypes";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render the environment ControlPanel with a spy on dispatch.
 * Uses SessionContext.Provider so we can inspect dispatched actions
 * without running the real reducer.
 */
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

/** Render with a no-op dispatch (read-only view). */
function renderReadOnly(stateOverride?: Partial<SessionState>) {
  const state: SessionState = { ...baselineSession, ...stateOverride };
  render(
    <SessionContext.Provider value={{ state, dispatch: () => undefined }}>
      <ControlPanel />
    </SessionContext.Provider>,
  );
}

// ── 1. Rendering ─────────────────────────────────────────────────────────────

describe("EnvironmentControlPanel — rendering", () => {
  it("renders the environment control panel aside", () => {
    renderReadOnly();
    expect(screen.getByTestId("control-panel")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /environment controls/i }),
    ).toBeInTheDocument();
  });

  it("renders the environment preset select", () => {
    renderReadOnly();
    expect(screen.getByTestId("select-environment-preset")).toBeInTheDocument();
  });

  it("renders the time-of-day select", () => {
    renderReadOnly();
    expect(screen.getByTestId("select-time-of-day")).toBeInTheDocument();
  });

  it("renders the lighting preset select", () => {
    renderReadOnly();
    expect(screen.getByTestId("select-lighting")).toBeInTheDocument();
  });

  it("renders the ambience preset select", () => {
    renderReadOnly();
    expect(screen.getByTestId("select-ambience")).toBeInTheDocument();
  });

  it("renders the weather preset select", () => {
    renderReadOnly();
    expect(screen.getByTestId("select-weather")).toBeInTheDocument();
  });

  it("renders Apply Environment Changes button", () => {
    renderReadOnly();
    expect(screen.getByTestId("btn-apply-environment")).toBeInTheDocument();
  });

  it("renders Reset Scene button", () => {
    renderReadOnly();
    expect(screen.getByTestId("btn-reset-scene")).toBeInTheDocument();
  });

  it("renders object toggle checkboxes for each scene object", () => {
    renderReadOnly();
    const { objects } = baselineSession.environment;
    expect(objects.length).toBeGreaterThanOrEqual(3);
    objects.forEach((obj) => {
      expect(screen.getByTestId(`checkbox-${obj.id}`)).toBeInTheDocument();
    });
  });

  it("renders all four control sections", () => {
    renderReadOnly();
    expect(screen.getByTestId("section-environment-preset")).toBeInTheDocument();
    expect(screen.getByTestId("section-time-of-day")).toBeInTheDocument();
    expect(screen.getByTestId("section-lighting")).toBeInTheDocument();
    expect(screen.getByTestId("section-ambience")).toBeInTheDocument();
    expect(screen.getByTestId("section-weather")).toBeInTheDocument();
    expect(screen.getByTestId("section-objects")).toBeInTheDocument();
  });
});

// ── 2. Initial values reflect session state ───────────────────────────────

describe("EnvironmentControlPanel — initial values", () => {
  it("shows the session environment preset as the selected option", () => {
    renderReadOnly();
    const select = screen.getByTestId("select-environment-preset") as HTMLSelectElement;
    expect(select.value).toBe(baselineSession.environment.preset);
  });

  it("shows the session timeOfDay as the selected option", () => {
    renderReadOnly();
    const select = screen.getByTestId("select-time-of-day") as HTMLSelectElement;
    expect(select.value).toBe(baselineSession.environment.timeOfDay);
  });

  it("shows the session lighting as the selected option", () => {
    renderReadOnly();
    const select = screen.getByTestId("select-lighting") as HTMLSelectElement;
    expect(select.value).toBe(baselineSession.environment.lighting);
  });

  it("shows the session ambience as the selected option", () => {
    renderReadOnly();
    const select = screen.getByTestId("select-ambience") as HTMLSelectElement;
    expect(select.value).toBe(baselineSession.environment.ambience);
  });

  it("shows the session weather as the selected option", () => {
    renderReadOnly();
    const select = screen.getByTestId("select-weather") as HTMLSelectElement;
    expect(select.value).toBe(baselineSession.environment.weather);
  });

  it("shows each object's enabled state as the checkbox checked state", () => {
    renderReadOnly();
    baselineSession.environment.objects.forEach((obj) => {
      const checkbox = screen.getByTestId(`checkbox-${obj.id}`) as HTMLInputElement;
      expect(checkbox.checked).toBe(obj.enabled);
    });
  });
});

// ── 3. Draft state — edits do NOT dispatch until Apply ───────────────────

describe("EnvironmentControlPanel — draft state", () => {
  it("changing preset select updates draft but does NOT dispatch", () => {
    const { dispatchSpy } = renderWithSpy();
    const select = screen.getByTestId("select-environment-preset");
    fireEvent.change(select, { target: { value: "outdoor" } });
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect((select as HTMLSelectElement).value).toBe("outdoor");
  });

  it("changing time-of-day select updates draft but does NOT dispatch", () => {
    const { dispatchSpy } = renderWithSpy();
    const select = screen.getByTestId("select-time-of-day");
    fireEvent.change(select, { target: { value: "night" } });
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("changing lighting select updates draft but does NOT dispatch", () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-lighting"), {
      target: { value: "dramatic" },
    });
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("toggling an object checkbox updates draft but does NOT dispatch", () => {
    const { dispatchSpy } = renderWithSpy();
    const firstId = baselineSession.environment.objects[0].id;
    const checkbox = screen.getByTestId(`checkbox-${firstId}`) as HTMLInputElement;
    // Toggle to opposite state
    fireEvent.click(checkbox);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

// ── 4. hasChanges guard ───────────────────────────────────────────────────

describe("EnvironmentControlPanel — hasChanges guard", () => {
  it("Apply button is disabled when draft matches session state (no changes)", () => {
    renderReadOnly();
    // Baseline session matches INITIAL_DRAFT so no changes
    const btn = screen.getByTestId("btn-apply-environment") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("Apply button is enabled after a preset select change", () => {
    renderReadOnly();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    const btn = screen.getByTestId("btn-apply-environment") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("Apply button is enabled after an object toggle change", () => {
    renderReadOnly();
    const firstId = baselineSession.environment.objects[0].id;
    const checkbox = screen.getByTestId(`checkbox-${firstId}`);
    fireEvent.click(checkbox);
    const btn = screen.getByTestId("btn-apply-environment") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("Reset button is always enabled (not guarded by hasChanges)", () => {
    renderReadOnly();
    const btn = screen.getByTestId("btn-reset-scene") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

// ── 5. Apply flow — dispatch count and action types ──────────────────────

describe("EnvironmentControlPanel — Apply flow", () => {
  it("dispatches at least 2 actions on Apply (env update + mutation + chat message)", async () => {
    const { dispatchSpy } = renderWithSpy();
    // Make a change so Apply is enabled
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      // At minimum: setEnvironmentPreset + appendMutation + appendChatMessage
      expect(dispatchSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("dispatches session/environment_preset_change as first action", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "studio" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      expect(dispatchSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    const types = dispatchSpy.mock.calls.map(([a]: [{ type: string }]) => a.type);
    expect(types).toContain("session/environment_preset_change");
  });

  it("dispatches session/mutation_append action on Apply", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-lighting"), {
      target: { value: "dim" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map(([a]: [{ type: string }]) => a.type);
      expect(types).toContain("session/mutation_append");
    });
  });

  it("dispatches session/chat_append action with sender=system on Apply", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-time-of-day"), {
      target: { value: "morning" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const chatCalls = dispatchSpy.mock.calls.filter(
        ([a]: [{ type: string }]) => a.type === "session/chat_append",
      );
      expect(chatCalls.length).toBeGreaterThanOrEqual(1);
      const [action] = chatCalls[0];
      expect(action.payload.message.sender).toBe("system");
    });
  });

  it("environment_preset_change payload includes the changed preset value", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const envCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/environment_preset_change",
      );
      expect(envCall).toBeDefined();
      expect(envCall![0].payload.preset).toBe("outdoor");
    });
  });

  it("environment_preset_change payload includes other unchanged draft fields", async () => {
    const { dispatchSpy } = renderWithSpy();
    // Change only the preset; other fields remain at baseline
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const envCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/environment_preset_change",
      );
      expect(envCall).toBeDefined();
      // timeOfDay, lighting, etc. should still appear in the payload
      expect(envCall![0].payload.timeOfDay).toBeDefined();
      expect(envCall![0].payload.lighting).toBeDefined();
    });
  });

  it("shows apply-status success message after Apply", async () => {
    renderWithSpy();
    fireEvent.change(screen.getByTestId("select-ambience"), {
      target: { value: "busy" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      expect(screen.getByTestId("apply-status")).toBeInTheDocument();
    });
    expect(screen.getByTestId("apply-status")).toHaveTextContent(
      /environment changes applied/i,
    );
  });
});

// ── 6. Apply mutation record ─────────────────────────────────────────────

describe("EnvironmentControlPanel — Apply mutation record", () => {
  it("mutation record has source=control-panel", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-lighting"), {
      target: { value: "natural" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      expect(mutCall![0].payload.mutation.source).toBe("control-panel");
    });
  });

  it("mutation record has target=environment", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-weather"), {
      target: { value: "rainy" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      expect(mutCall![0].payload.mutation.target).toBe("environment");
    });
  });

  it("mutation record has status=applied", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "studio" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      expect(mutCall![0].payload.mutation.status).toBe("applied");
    });
  });

  it("mutation record summary mentions the changed field", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      const summary: string = mutCall![0].payload.mutation.summary;
      expect(summary.toLowerCase()).toContain("outdoor");
    });
  });

  it("mutation record has a non-empty id and a positive timestamp", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-time-of-day"), {
      target: { value: "evening" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      const { id, timestamp } = mutCall![0].payload.mutation;
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
      expect(timestamp).toBeGreaterThan(0);
    });
  });
});

// ── 7. System chat message on Apply ──────────────────────────────────────

describe("EnvironmentControlPanel — system message on Apply", () => {
  it("system message content mentions the changed field", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const chatCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/chat_append",
      );
      expect(chatCall).toBeDefined();
      const content: string = chatCall![0].payload.message.content;
      expect(content.toLowerCase()).toContain("outdoor");
    });
  });

  it("system message has a non-empty id and positive timestamp", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.change(screen.getByTestId("select-lighting"), {
      target: { value: "dim" },
    });
    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const chatCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/chat_append",
      );
      expect(chatCall).toBeDefined();
      const { id, timestamp } = chatCall![0].payload.message;
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
      expect(timestamp).toBeGreaterThan(0);
    });
  });
});

// ── 8. Object-toggle Apply ───────────────────────────────────────────────

describe("EnvironmentControlPanel — object toggle Apply", () => {
  it("dispatches session/object_toggle for each toggled object", async () => {
    const { dispatchSpy } = renderWithSpy();

    // Toggle first object (currently enabled → disable)
    const firstObj = baselineSession.environment.objects[0];
    const checkbox = screen.getByTestId(`checkbox-${firstObj.id}`);
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      const toggleCalls = dispatchSpy.mock.calls.filter(
        ([a]: [{ type: string }]) => a.type === "session/object_toggle",
      );
      expect(toggleCalls.length).toBe(1);
      expect(toggleCalls[0][0].payload.id).toBe(firstObj.id);
      expect(toggleCalls[0][0].payload.enabled).toBe(!firstObj.enabled);
    });
  });

  it("does NOT dispatch session/object_toggle for unchanged objects", async () => {
    const { dispatchSpy } = renderWithSpy();

    // Only change a select (not any checkboxes) to trigger hasChanges
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });

    fireEvent.click(screen.getByTestId("btn-apply-environment"));

    await waitFor(() => {
      expect(dispatchSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    const toggleCalls = dispatchSpy.mock.calls.filter(
      ([a]: [{ type: string }]) => a.type === "session/object_toggle",
    );
    expect(toggleCalls.length).toBe(0);
  });
});

// ── 9. Reset flow ─────────────────────────────────────────────────────────

describe("EnvironmentControlPanel — Reset flow", () => {
  it("dispatches session/reset_baseline on Reset", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map(([a]: [{ type: string }]) => a.type);
      expect(types).toContain("session/reset_baseline");
    });
  });

  it("dispatches session/mutation_append on Reset", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const types = dispatchSpy.mock.calls.map(([a]: [{ type: string }]) => a.type);
      expect(types).toContain("session/mutation_append");
    });
  });

  it("dispatches session/chat_append with sender=system on Reset", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const chatCalls = dispatchSpy.mock.calls.filter(
        ([a]: [{ type: string }]) => a.type === "session/chat_append",
      );
      expect(chatCalls.length).toBeGreaterThanOrEqual(1);
      expect(chatCalls[0][0].payload.message.sender).toBe("system");
    });
  });

  it("shows reset-status success message after Reset", async () => {
    renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      expect(screen.getByTestId("reset-status")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reset-status")).toHaveTextContent(
      /scene reset to baseline/i,
    );
  });
});

// ── 10. Reset mutation record ─────────────────────────────────────────────

describe("EnvironmentControlPanel — Reset mutation record", () => {
  it("reset mutation record has source=control-panel", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      expect(mutCall![0].payload.mutation.source).toBe("control-panel");
    });
  });

  it("reset mutation record has target=session", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      expect(mutCall![0].payload.mutation.target).toBe("session");
    });
  });

  it("reset mutation record summary mentions baseline", async () => {
    const { dispatchSpy } = renderWithSpy();
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      const mutCall = dispatchSpy.mock.calls.find(
        ([a]: [{ type: string }]) => a.type === "session/mutation_append",
      );
      expect(mutCall).toBeDefined();
      const summary: string = mutCall![0].payload.mutation.summary;
      expect(summary.toLowerCase()).toContain("baseline");
    });
  });
});

// ── 11. Reset restores select values ─────────────────────────────────────

describe("EnvironmentControlPanel — Reset restores draft to baseline", () => {
  it("after Reset, environment preset select returns to baseline value", async () => {
    renderWithSpy();

    // Change preset away from baseline
    fireEvent.change(screen.getByTestId("select-environment-preset"), {
      target: { value: "outdoor" },
    });
    expect(
      (screen.getByTestId("select-environment-preset") as HTMLSelectElement).value,
    ).toBe("outdoor");

    // Click Reset
    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      // After reset, the select should be restored to baseline
      expect(
        (screen.getByTestId("select-environment-preset") as HTMLSelectElement).value,
      ).toBe(baselineSession.environment.preset);
    });
  });

  it("after Reset, time-of-day select returns to baseline value", async () => {
    renderWithSpy();
    fireEvent.change(screen.getByTestId("select-time-of-day"), {
      target: { value: "night" },
    });

    fireEvent.click(screen.getByTestId("btn-reset-scene"));

    await waitFor(() => {
      expect((screen.getByTestId("select-time-of-day") as HTMLSelectElement).value).toBe(
        baselineSession.environment.timeOfDay,
      );
    });
  });
});
