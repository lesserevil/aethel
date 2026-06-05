import { render, screen, act } from "@testing-library/react";
import {
  SessionProvider,
  useSessionState,
  useSessionDispatch,
  useChatContext,
  useRendererProps,
} from "./SessionProvider";
import {
  setAgentIdentity,
  appendChatMessage,
  setEnvironmentPreset,
  resetSession,
} from "./sessionActions";
import { baselineSession } from "./baselineSession";
import { ChatMessage } from "./sessionTypes";

// ── Helper component factory ──────────────────────────────────────────────────

/** Renders a component inside the real SessionProvider and exposes state via data-testid attributes. */
const StateDisplay: React.FC = () => {
  const state = useSessionState();
  return (
    <div>
      <span data-testid="agent-name">{state.agent.displayName}</span>
      <span data-testid="env-preset">{state.environment.preset}</span>
      <span data-testid="message-count">{state.chat.messages.length}</span>
      <span data-testid="mutation-count">{state.mutations.length}</span>
      <span data-testid="session-id">{state.sessionId}</span>
    </div>
  );
};

// ── Baseline state ────────────────────────────────────────────────────────────

describe("SessionProvider – baseline state", () => {
  test("initializes with baselineSession values", () => {
    render(
      <SessionProvider>
        <StateDisplay />
      </SessionProvider>,
    );
    expect(screen.getByTestId("agent-name").textContent).toBe(
      baselineSession.agent.displayName,
    );
    expect(screen.getByTestId("env-preset").textContent).toBe(
      baselineSession.environment.preset,
    );
    expect(screen.getByTestId("message-count").textContent).toBe("0");
    expect(screen.getByTestId("mutation-count").textContent).toBe("0");
    expect(screen.getByTestId("session-id").textContent).toBe(baselineSession.sessionId);
  });
});

// ── Dispatch through context ──────────────────────────────────────────────────

describe("SessionProvider – dispatch through context", () => {
  const DispatchTest: React.FC = () => {
    const dispatch = useSessionDispatch();
    const state = useSessionState();
    return (
      <div>
        <span data-testid="agent-name">{state.agent.displayName}</span>
        <button
          data-testid="rename-btn"
          onClick={() => dispatch(setAgentIdentity({ displayName: "Dispatched Name" }))}
        >
          Rename
        </button>
      </div>
    );
  };

  test("dispatching setAgentIdentity updates the displayed agent name", () => {
    render(
      <SessionProvider>
        <DispatchTest />
      </SessionProvider>,
    );
    expect(screen.getByTestId("agent-name").textContent).toBe("Aethel Agent");
    act(() => {
      screen.getByTestId("rename-btn").click();
    });
    expect(screen.getByTestId("agent-name").textContent).toBe("Dispatched Name");
  });

  test("dispatching appendChatMessage increments the message count", () => {
    const msg: ChatMessage = { id: "m1", content: "Hi", timestamp: 1, sender: "user" };
    const AppendTest: React.FC = () => {
      const dispatch = useSessionDispatch();
      const state = useSessionState();
      return (
        <div>
          <span data-testid="count">{state.chat.messages.length}</span>
          <button data-testid="add-btn" onClick={() => dispatch(appendChatMessage(msg))}>
            Add
          </button>
        </div>
      );
    };

    render(
      <SessionProvider>
        <AppendTest />
      </SessionProvider>,
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    act(() => screen.getByTestId("add-btn").click());
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  test("dispatching setEnvironmentPreset updates the env preset", () => {
    const EnvTest: React.FC = () => {
      const dispatch = useSessionDispatch();
      const { environment } = useSessionState();
      return (
        <div>
          <span data-testid="preset">{environment.preset}</span>
          <button
            data-testid="change-btn"
            onClick={() => dispatch(setEnvironmentPreset({ preset: "outdoor" }))}
          >
            Change
          </button>
        </div>
      );
    };

    render(
      <SessionProvider>
        <EnvTest />
      </SessionProvider>,
    );
    expect(screen.getByTestId("preset").textContent).toBe("office");
    act(() => screen.getByTestId("change-btn").click());
    expect(screen.getByTestId("preset").textContent).toBe("outdoor");
  });

  test("reset restores baseline agent name while preserving chat messages", () => {
    const ResetTest: React.FC = () => {
      const dispatch = useSessionDispatch();
      const state = useSessionState();
      return (
        <div>
          <span data-testid="name">{state.agent.displayName}</span>
          <span data-testid="msgs">{state.chat.messages.length}</span>
          <button
            data-testid="rename"
            onClick={() => dispatch(setAgentIdentity({ displayName: "Temp" }))}
          >
            Rename
          </button>
          <button
            data-testid="add-msg"
            onClick={() =>
              dispatch(
                appendChatMessage({
                  id: "x",
                  content: "keep",
                  timestamp: 1,
                  sender: "user",
                }),
              )
            }
          >
            Add msg
          </button>
          <button data-testid="reset" onClick={() => dispatch(resetSession())}>
            Reset
          </button>
        </div>
      );
    };

    render(
      <SessionProvider>
        <ResetTest />
      </SessionProvider>,
    );

    act(() => screen.getByTestId("rename").click());
    act(() => screen.getByTestId("add-msg").click());
    expect(screen.getByTestId("name").textContent).toBe("Temp");
    expect(screen.getByTestId("msgs").textContent).toBe("1");

    act(() => screen.getByTestId("reset").click());
    expect(screen.getByTestId("name").textContent).toBe("Aethel Agent");
    expect(screen.getByTestId("msgs").textContent).toBe("1"); // preserved
  });
});

// ── Derived hooks ─────────────────────────────────────────────────────────────

describe("useChatContext hook", () => {
  test("returns current chat state slice", () => {
    const msg: ChatMessage = { id: "c1", content: "Test", timestamp: 1, sender: "user" };
    const ChatHookTest: React.FC = () => {
      const dispatch = useSessionDispatch();
      const chat = useChatContext();
      return (
        <div>
          <span data-testid="msgs">{chat.messages.length}</span>
          <button data-testid="add" onClick={() => dispatch(appendChatMessage(msg))}>
            Add
          </button>
        </div>
      );
    };

    render(
      <SessionProvider>
        <ChatHookTest />
      </SessionProvider>,
    );
    expect(screen.getByTestId("msgs").textContent).toBe("0");
    act(() => screen.getByTestId("add").click());
    expect(screen.getByTestId("msgs").textContent).toBe("1");
  });
});

describe("useRendererProps hook", () => {
  test("returns agent and environment from session state", () => {
    const RendererHookTest: React.FC = () => {
      const props = useRendererProps();
      return (
        <div>
          <span data-testid="agent-name">{props.agent.displayName}</span>
          <span data-testid="env-preset">{props.environment.preset}</span>
          <span data-testid="sel-obj">{props.selectedObjectId ?? "none"}</span>
        </div>
      );
    };

    render(
      <SessionProvider>
        <RendererHookTest />
      </SessionProvider>,
    );
    expect(screen.getByTestId("agent-name").textContent).toBe("Aethel Agent");
    expect(screen.getByTestId("env-preset").textContent).toBe("office");
    expect(screen.getByTestId("sel-obj").textContent).toBe("none");
  });
});
