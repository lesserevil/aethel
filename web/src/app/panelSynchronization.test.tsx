// panelSynchronization.test.tsx
// Component/integration tests for MVP panel synchronization.
//
// These tests render the full AppShell (all three columns) using a live
// useReducer session — not a dispatch spy — so that real state flows from
// the left control panel through shared session state to the chat and
// viewport panels.
//
// WebGL is avoided by mocking @react-three/fiber and @react-three/drei.
// The renderer stub exposes data-* attributes that carry the derived props
// forwarded by the viewport boundary.

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import React, { useReducer } from "react";

// ── R3F / Drei mocks (must appear before component imports) ───────────────

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

// ── Suppress noisy JSDOM / R3F console.error noise ────────────────────────

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

// ── Component imports (after mocks) ───────────────────────────────────────

import { AppShell } from "./AppShell";
import { SessionContext } from "../state/SessionProvider";
import { baselineSession } from "../state/baselineSession";
import { reducer } from "../state/sessionReducer";
import type { SessionState } from "../state/sessionTypes";

// ── Shared test infrastructure ─────────────────────────────────────────────

/**
 * LiveSessionShell renders AppShell with a real useReducer session so that
 * every dispatch actually mutates shared state and re-renders all panels.
 *
 * A chat adapter stub is injected via the ChatPanel `adapter` prop so that
 * chat messages don't make real async network calls in tests.
 */
function LiveSessionShell({ initialState = baselineSession }: { initialState?: SessionState }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      <AppShell />
    </SessionContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Test suite 1: Agent appearance change
// Scenario: user selects "robot" avatar and "coral" accent color,
//           then clicks "Apply Agent Changes".
// ─────────────────────────────────────────────────────────────────────────

describe("Panel synchronization — agent appearance change", () => {
  function setup() {
    render(<LiveSessionShell />);

    // Locate appearance controls inside the agent control panel
    const agentPanel = screen.getByTestId("agent-control-panel");
    const robotBtn = within(agentPanel).getByTestId("avatar-preset-robot");
    const coralSwatch = within(agentPanel).getByTestId("accent-color-coral");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    return { agentPanel, robotBtn, coralSwatch, applyBtn };
  }

  it("after applying, the viewport agent avatar reflects the new avatarPreset", () => {
    const { robotBtn, applyBtn } = setup();

    fireEvent.click(robotBtn);
    fireEvent.click(applyBtn);

    const avatar = screen.getByTestId("agent-avatar");
    expect(avatar).toHaveAttribute("data-avatar-preset", "robot");
  });

  it("after applying, the viewport agent avatar reflects the new accent color", () => {
    const { coralSwatch, applyBtn } = setup();

    fireEvent.click(coralSwatch);
    fireEvent.click(applyBtn);

    const nameLabel = screen.getByTestId("agent-name-label");
    expect(nameLabel).toHaveStyle({ color: "#FF6B6B" });
  });

  it("after applying, the ChatPanel displays a system message describing the change", () => {
    const { robotBtn, applyBtn } = setup();

    fireEvent.click(robotBtn);
    fireEvent.click(applyBtn);

    // At least one system message should now appear in chat
    const chatMessages = screen.getByTestId("chat-messages");
    const systemMessages = within(chatMessages).queryAllByTestId("chat-message-system");
    expect(systemMessages.length).toBeGreaterThanOrEqual(1);

    // The system message content should reference "robot" or "Agent updated"
    const anyMentionsChange = systemMessages.some(
      (el) => el.textContent?.includes("robot") || el.textContent?.includes("Agent updated"),
    );
    expect(anyMentionsChange).toBe(true);
  });

  it("after applying, the mutations list in session state contains a new control-panel/agent record", () => {
    // We spy on the underlying reducer to capture dispatched actions
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const robotBtn = within(agentPanel).getByTestId("avatar-preset-robot");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.click(robotBtn);
    fireEvent.click(applyBtn);

    const agentMutations = capturedState.mutations.filter(
      (m) => m.source === "control-panel" && m.target === "agent" && m.status === "applied",
    );
    expect(agentMutations.length).toBeGreaterThanOrEqual(1);
  });

  it("before applying, editing the avatar preset does NOT change viewport state", () => {
    const { robotBtn } = setup();

    // Click the robot button but do NOT apply
    fireEvent.click(robotBtn);

    // Viewport should still show the baseline (humanoid)
    const avatar = screen.getByTestId("agent-avatar");
    expect(avatar).toHaveAttribute("data-avatar-preset", "humanoid");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Test suite 2: Agent behavior / persona change
// Scenario: user selects "analytical" persona, bumps curiosity slider,
//           then clicks "Apply Agent Changes".
// ─────────────────────────────────────────────────────────────────────────

describe("Panel synchronization — agent behavior/persona change", () => {
  function setup() {
    render(<LiveSessionShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const personaSelect = within(agentPanel).getByTestId("agent-persona-select");
    const curiositySlider = within(agentPanel).getByLabelText(/curiosity/i);
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    return { agentPanel, personaSelect, curiositySlider, applyBtn };
  }

  it("after applying a persona change, the viewport name label reflects the updated display (agent still renders)", () => {
    const { personaSelect, applyBtn } = setup();

    fireEvent.change(personaSelect, { target: { value: "analytical" } });
    fireEvent.click(applyBtn);

    // The viewport agent avatar and name label should still render (not crash)
    expect(screen.getByTestId("agent-avatar")).toBeInTheDocument();
    expect(screen.getByTestId("agent-name-label")).toBeInTheDocument();
  });

  it("after applying a behavior change, the ChatPanel shows a system/context message", () => {
    const { curiositySlider, applyBtn } = setup();

    fireEvent.change(curiositySlider, { target: { value: "0.9" } });
    fireEvent.click(applyBtn);

    const chatMessages = screen.getByTestId("chat-messages");
    const systemMessages = within(chatMessages).queryAllByTestId("chat-message-system");
    expect(systemMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("after applying a persona change, session state reflects the new personaPreset", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const personaSelect = within(agentPanel).getByTestId("agent-persona-select");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.change(personaSelect, { target: { value: "creative" } });
    fireEvent.click(applyBtn);

    expect(capturedState.agent.personaPreset).toBe("creative");
  });

  it("after applying a behavior change, session state reflects the updated curiosity value", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const curiositySlider = within(agentPanel).getByLabelText(/curiosity/i);
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.change(curiositySlider, { target: { value: "1" } });
    fireEvent.click(applyBtn);

    expect(capturedState.agent.behavior.curiosity).toBe(1);
  });

  it("after applying, a mutation record with target=agent and source=control-panel is appended", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const personaSelect = within(agentPanel).getByTestId("agent-persona-select");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.change(personaSelect, { target: { value: "analytical" } });
    fireEvent.click(applyBtn);

    const mutations = capturedState.mutations.filter(
      (m) => m.source === "control-panel" && m.target === "agent",
    );
    expect(mutations.length).toBeGreaterThanOrEqual(1);
    expect(mutations[0].status).toBe("applied");
  });

  it("chat system message content references the new persona", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const personaSelect = within(agentPanel).getByTestId("agent-persona-select");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.change(personaSelect, { target: { value: "analytical" } });
    fireEvent.click(applyBtn);

    // There should be at least one system chat message mentioning "analytical"
    const systemChatMsgs = capturedState.chat.messages.filter(
      (m) => m.sender === "system" && m.content.includes("analytical"),
    );
    expect(systemChatMsgs.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Test suite 3: Environment / object change
// Scenario: user selects "outdoor" environment preset, then clicks
//           "Apply Environment Changes".
// ─────────────────────────────────────────────────────────────────────────

describe("Panel synchronization — environment/object change", () => {
  function setup() {
    render(<LiveSessionShell />);

    const envSelect = screen.getByTestId("select-environment-preset");
    const applyBtn = screen.getByTestId("btn-apply-environment");
    const timeSelect = screen.getByTestId("select-time-of-day");

    return { envSelect, applyBtn, timeSelect };
  }

  it("after applying an environment change, the viewport still renders without error", () => {
    const { envSelect, applyBtn } = setup();

    // Change to outdoor — this differs from the default "laboratory"
    fireEvent.change(envSelect, { target: { value: "outdoor" } });
    fireEvent.click(applyBtn);

    expect(screen.getByTestId("aethel-viewport")).toBeInTheDocument();
  });

  it("after applying, the ChatPanel displays a system message describing the environment change", () => {
    const { envSelect, applyBtn } = setup();

    fireEvent.change(envSelect, { target: { value: "outdoor" } });
    fireEvent.click(applyBtn);

    const chatMessages = screen.getByTestId("chat-messages");
    const systemMessages = within(chatMessages).queryAllByTestId("chat-message-system");
    expect(systemMessages.length).toBeGreaterThanOrEqual(1);

    const anyMentionsEnvironment = systemMessages.some(
      (el) =>
        el.textContent?.toLowerCase().includes("outdoor") ||
        el.textContent?.toLowerCase().includes("environment"),
    );
    expect(anyMentionsEnvironment).toBe(true);
  });

  it("after applying, session state environment.preset is updated", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const envSelect = screen.getByTestId("select-environment-preset");
    const applyBtn = screen.getByTestId("btn-apply-environment");

    fireEvent.change(envSelect, { target: { value: "office" } });
    fireEvent.click(applyBtn);

    expect(capturedState.environment.preset).toBe("office");
  });

  it("after applying, a mutation record with target=environment and source=control-panel is appended", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const envSelect = screen.getByTestId("select-environment-preset");
    const applyBtn = screen.getByTestId("btn-apply-environment");

    fireEvent.change(envSelect, { target: { value: "studio" } });
    fireEvent.click(applyBtn);

    const envMutations = capturedState.mutations.filter(
      (m) => m.source === "control-panel" && m.target === "environment" && m.status === "applied",
    );
    expect(envMutations.length).toBeGreaterThanOrEqual(1);
  });

  it("before applying, changing the preset select does NOT update session environment state", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const envSelect = screen.getByTestId("select-environment-preset");
    fireEvent.change(envSelect, { target: { value: "outdoor" } });

    // Environment state should NOT change until Apply is clicked
    expect(capturedState.environment.preset).toBe("laboratory");
  });

  it("toggling an object checkbox and applying dispatches object toggle and a system chat message", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    // Toggle obj-001 off
    const checkbox = screen.getByTestId("checkbox-obj-001") as HTMLInputElement;
    fireEvent.click(checkbox);

    const applyBtn = screen.getByTestId("btn-apply-environment");
    fireEvent.click(applyBtn);

    // Object toggle should have been applied
    const obj001 = capturedState.environment.objects.find((o) => o.id === "obj-001");
    expect(obj001?.enabled).toBe(false);

    // System message in chat
    const chatMessages = screen.getByTestId("chat-messages");
    const systemMessages = within(chatMessages).queryAllByTestId("chat-message-system");
    expect(systemMessages.length).toBeGreaterThanOrEqual(1);
  });

  it("after applying time-of-day change, session environment.timeOfDay is updated and system message added", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const timeSelect = screen.getByTestId("select-time-of-day");
    const applyBtn = screen.getByTestId("btn-apply-environment");

    fireEvent.change(timeSelect, { target: { value: "night" } });
    fireEvent.click(applyBtn);

    expect(capturedState.environment.timeOfDay).toBe("night");

    const systemChatMsgs = capturedState.chat.messages.filter(
      (m) => m.sender === "system",
    );
    expect(systemChatMsgs.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Test suite 4: Cross-panel coherence (no panel-local state drift)
// These tests assert that panels cannot drift from shared session state.
// ─────────────────────────────────────────────────────────────────────────

describe("Panel synchronization — cross-panel coherence", () => {
  it("applying an agent appearance change propagates to the viewport without requiring a chat interaction", () => {
    render(<LiveSessionShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const abstractBtn = within(agentPanel).getByTestId("avatar-preset-abstract");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");

    fireEvent.click(abstractBtn);
    fireEvent.click(applyBtn);

    // Viewport must show updated preset immediately — no chat interaction needed
    const avatar = screen.getByTestId("agent-avatar");
    expect(avatar).toHaveAttribute("data-avatar-preset", "abstract");
  });

  it("applying a persona change appends exactly one system message to chat history", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const applyBtn = within(agentPanel).getByTestId("apply-agent-changes-btn");
    fireEvent.click(applyBtn);

    const systemMessages = capturedState.chat.messages.filter(
      (m) => m.sender === "system",
    );
    expect(systemMessages.length).toBe(1);
  });

  it("applying an environment change appends exactly one system message to chat history", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const envSelect = screen.getByTestId("select-environment-preset");
    const applyBtn = screen.getByTestId("btn-apply-environment");

    fireEvent.change(envSelect, { target: { value: "outdoor" } });
    fireEvent.click(applyBtn);

    const systemMessages = capturedState.chat.messages.filter(
      (m) => m.sender === "system",
    );
    expect(systemMessages.length).toBe(1);
  });

  it("applying sequential agent then environment changes accumulates both in mutations and chat", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    // First: apply agent change
    const agentPanel = screen.getByTestId("agent-control-panel");
    const robotBtn = within(agentPanel).getByTestId("avatar-preset-robot");
    const agentApply = within(agentPanel).getByTestId("apply-agent-changes-btn");
    fireEvent.click(robotBtn);
    fireEvent.click(agentApply);

    // Second: apply environment change
    const envSelect = screen.getByTestId("select-environment-preset");
    const envApply = screen.getByTestId("btn-apply-environment");
    fireEvent.change(envSelect, { target: { value: "outdoor" } });
    fireEvent.click(envApply);

    // Should have 2 mutations total
    expect(capturedState.mutations.length).toBeGreaterThanOrEqual(2);

    // Should have at least 2 system chat messages
    const systemMsgs = capturedState.chat.messages.filter((m) => m.sender === "system");
    expect(systemMsgs.length).toBeGreaterThanOrEqual(2);
  });

  it("session mutation records include timestamps and are appended in order", () => {
    let capturedState: SessionState = baselineSession;
    function CapturingShell() {
      const [state, dispatch] = useReducer((s: SessionState, a: unknown) => {
        capturedState = reducer(s, a as Parameters<typeof reducer>[1]);
        return capturedState;
      }, baselineSession);
      return (
        <SessionContext.Provider value={{ state, dispatch }}>
          <AppShell />
        </SessionContext.Provider>
      );
    }

    render(<CapturingShell />);

    const agentPanel = screen.getByTestId("agent-control-panel");
    const robotBtn = within(agentPanel).getByTestId("avatar-preset-robot");
    const agentApply = within(agentPanel).getByTestId("apply-agent-changes-btn");
    fireEvent.click(robotBtn);
    fireEvent.click(agentApply);

    const envSelect = screen.getByTestId("select-environment-preset");
    const envApply = screen.getByTestId("btn-apply-environment");
    fireEvent.change(envSelect, { target: { value: "outdoor" } });
    fireEvent.click(envApply);

    // Each mutation record must have a positive timestamp
    for (const mutation of capturedState.mutations) {
      expect(mutation.timestamp).toBeGreaterThan(0);
      expect(mutation.id).toBeTruthy();
    }

    // Mutations must be ordered chronologically (or equal timestamp for same tick)
    const timestamps = capturedState.mutations.map((m) => m.timestamp);
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });
});
