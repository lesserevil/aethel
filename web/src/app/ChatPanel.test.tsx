// ChatPanel.test.tsx
// Component tests for the ChatPanel right-column conversation surface.
//
// Covers:
//  1. Renders empty state correctly
//  2. Renders pre-existing message history (user, agent, system)
//  3. Sends a user message, shows pending, appends agent response
//  4. Adapter receives correct session context in request payload
//  5. Shows error banner on adapter failure without losing history
//  6. Disables send while a request is pending
//  7. System/context messages from state fixtures are displayed
//  8. Enter key triggers send; Shift+Enter does not
//  9. Send button disabled when input is empty

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";
import type { ChatAdapter, ChatRequest, ChatResponse } from "../services/chatAdapter";
import { ChatError } from "../services/chatAdapter";
import type { SessionState } from "../state/sessionTypes";
import { baselineSession, baselineSessionWithChat } from "../state/baselineSession";
import { useReducer, type ReactNode } from "react";
import { reducer } from "../state/sessionReducer";

// ── Test helpers ─────────────────────────────────────────────────────────────

import { SessionContext } from "../state/SessionProvider";

function RenderWithSession({
  session,
  adapter,
}: {
  session: SessionState;
  adapter?: ChatAdapter;
}) {
  const [state, dispatch] = useReducer(reducer, session);
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      <ChatPanel adapter={adapter} />
    </SessionContext.Provider>
  );
}

// ── Mock adapter factory ──────────────────────────────────────────────────

function makeMockAdapter(
  overrides: Partial<{
    response: string;
    newMessageId: string;
    delay: number;
    error: Error;
    capturedRequests: ChatRequest[];
  }> = {},
): ChatAdapter {
  const {
    response = "Mock agent response",
    newMessageId = "mock-agent-msg-id",
    delay = 0,
    error,
    capturedRequests = [],
  } = overrides;

  return {
    async send(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
      capturedRequests.push({ ...request });

      if (delay > 0) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, delay);
          signal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(new ChatError("Request aborted"));
          });
        });
      }

      if (signal?.aborted) {
        throw new ChatError("Request aborted");
      }

      if (error) throw error;

      return { response, newMessageId };
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("ChatPanel", () => {
  describe("1. Empty state", () => {
    it("renders the input, send button, and empty-state placeholder", () => {
      render(<RenderWithSession session={baselineSession} />);

      expect(screen.getByTestId("chat-input")).toBeInTheDocument();
      expect(screen.getByTestId("chat-send-btn")).toBeInTheDocument();
      expect(screen.getByTestId("chat-empty")).toBeInTheDocument();
    });

    it("send button is disabled when the input is empty", () => {
      render(<RenderWithSession session={baselineSession} />);
      expect(screen.getByTestId("chat-send-btn")).toBeDisabled();
    });

    it("does not show an error banner when there is no error", () => {
      render(<RenderWithSession session={baselineSession} />);
      expect(screen.queryByTestId("chat-error")).not.toBeInTheDocument();
    });
  });

  describe("2. Pre-existing message history", () => {
    it("renders user messages from initial state", () => {
      render(<RenderWithSession session={baselineSessionWithChat} />);
      const userMessages = screen.getAllByTestId("chat-message-user");
      expect(userMessages.length).toBeGreaterThanOrEqual(1);
    });

    it("renders agent messages from initial state", () => {
      render(<RenderWithSession session={baselineSessionWithChat} />);
      const agentMessages = screen.getAllByTestId("chat-message-agent");
      expect(agentMessages.length).toBeGreaterThanOrEqual(1);
    });

    it("renders system/context messages from initial state", () => {
      const sessionWithSystem: SessionState = {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: [
            {
              id: "sys-001",
              content: "Environment changed to outdoor preset",
              timestamp: Date.now(),
              sender: "system",
            },
          ],
        },
      };

      render(<RenderWithSession session={sessionWithSystem} />);
      const systemMessages = screen.getAllByTestId("chat-message-system");
      expect(systemMessages.length).toBe(1);
      expect(systemMessages[0]).toHaveTextContent(
        "Environment changed to outdoor preset",
      );
    });

    it("does not render the empty-state placeholder when messages exist", () => {
      render(<RenderWithSession session={baselineSessionWithChat} />);
      expect(screen.queryByTestId("chat-empty")).not.toBeInTheDocument();
    });
  });

  describe("3. Send message flow", () => {
    it("appends the user message immediately on send", async () => {
      const adapter = makeMockAdapter();
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      const input = screen.getByTestId("chat-input");
      await userEvent.type(input, "Hello agent");

      const btn = screen.getByTestId("chat-send-btn");
      await userEvent.click(btn);

      const userMessages = screen.getAllByTestId("chat-message-user");
      expect(userMessages[0]).toHaveTextContent("Hello agent");
    });

    it("clears the input after sending", async () => {
      const adapter = makeMockAdapter();
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      const input = screen.getByTestId("chat-input") as HTMLTextAreaElement;
      await userEvent.type(input, "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      expect(input.value).toBe("");
    });

    it("shows the pending indicator while the adapter is working", async () => {
      // Adapter takes 200ms so we can observe pending state
      const adapter = makeMockAdapter({ delay: 200 });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      const input = screen.getByTestId("chat-input");
      await userEvent.type(input, "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      // Pending indicator should appear before the adapter resolves.
      expect(screen.getByTestId("chat-pending")).toBeInTheDocument();

      // Wait for adapter to finish.
      await waitFor(() =>
        expect(screen.queryByTestId("chat-pending")).not.toBeInTheDocument(),
      );
    });

    it("disables the send button and input while pending", async () => {
      const adapter = makeMockAdapter({ delay: 200 });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      expect(screen.getByTestId("chat-send-btn")).toBeDisabled();
      expect(screen.getByTestId("chat-input")).toBeDisabled();

      await waitFor(() =>
        expect(screen.queryByTestId("chat-pending")).not.toBeInTheDocument(),
      );
    });

    it("appends the agent response after the adapter resolves", async () => {
      const adapter = makeMockAdapter({ response: "Agent says hello!" });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Hey");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() =>
        expect(screen.getByTestId("chat-message-agent")).toBeInTheDocument(),
      );
      expect(screen.getByTestId("chat-message-agent")).toHaveTextContent(
        "Agent says hello!",
      );
    });
  });

  describe("4. Adapter request payload", () => {
    it("sends the correct sessionId in the request", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Test");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(capturedRequests.length).toBe(1));
      expect(capturedRequests[0].sessionId).toBe(baselineSession.sessionId);
    });

    it("sends current agentState in the request", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Test");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(capturedRequests.length).toBe(1));
      expect(capturedRequests[0].agentState).toEqual(baselineSession.agent);
    });

    it("sends current environmentState in the request", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Test");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(capturedRequests.length).toBe(1));
      expect(capturedRequests[0].environmentState).toEqual(baselineSession.environment);
    });

    it("includes prior chat messages in recentMessages", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSessionWithChat} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "New message");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(capturedRequests.length).toBe(1));
      // recentMessages should include the pre-existing messages plus the new user message
      const prior = baselineSessionWithChat.chat.messages.length;
      expect(capturedRequests[0].recentMessages.length).toBeGreaterThan(prior);
    });

    it("sends the typed user message as userMessage", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "What is the weather?");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(capturedRequests.length).toBe(1));
      expect(capturedRequests[0].userMessage).toBe("What is the weather?");
    });
  });

  describe("5. Error handling", () => {
    it("shows an error banner when the adapter throws", async () => {
      const adapter = makeMockAdapter({
        error: new ChatError("Service unavailable"),
      });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(screen.getByTestId("chat-error")).toBeInTheDocument());
      expect(screen.getByTestId("chat-error")).toHaveTextContent("Service unavailable");
    });

    it("preserves message history when the adapter throws", async () => {
      const sessionWithMessages: SessionState = {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: [
            {
              id: "existing-001",
              content: "Earlier message",
              timestamp: Date.now(),
              sender: "user",
            },
          ],
        },
      };

      const adapter = makeMockAdapter({
        error: new ChatError("Network error"),
      });
      render(<RenderWithSession session={sessionWithMessages} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(screen.getByTestId("chat-error")).toBeInTheDocument());

      // Original message must still be visible.
      const userMessages = screen.getAllByTestId("chat-message-user");
      const texts = userMessages.map((el) => el.textContent);
      expect(texts.some((t) => t?.includes("Earlier message"))).toBe(true);
    });

    it("clears the error banner after a successful subsequent send", async () => {
      let callCount = 0;
      const mixedAdapter: ChatAdapter = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async send(_: ChatRequest): Promise<ChatResponse> {
          callCount++;
          if (callCount === 1) throw new ChatError("First call failed");
          return { response: "OK", newMessageId: "id-2" };
        },
      };

      render(<RenderWithSession session={baselineSession} adapter={mixedAdapter} />);

      // First send — should error.
      await userEvent.type(screen.getByTestId("chat-input"), "first");
      await userEvent.click(screen.getByTestId("chat-send-btn"));
      await waitFor(() => expect(screen.getByTestId("chat-error")).toBeInTheDocument());

      // Second send — should succeed and clear the error.
      await userEvent.type(screen.getByTestId("chat-input"), "second");
      await userEvent.click(screen.getByTestId("chat-send-btn"));
      await waitFor(() =>
        expect(screen.queryByTestId("chat-error")).not.toBeInTheDocument(),
      );
    });

    it("does not delete existing messages on adapter error", async () => {
      const adapter = makeMockAdapter({ error: new Error("Boom") });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      await userEvent.type(screen.getByTestId("chat-input"), "Test");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() => expect(screen.getByTestId("chat-error")).toBeInTheDocument());

      // The user message that was sent should still appear in history.
      const userMessages = screen.getAllByTestId("chat-message-user");
      expect(userMessages.some((el) => el.textContent?.includes("Test"))).toBe(true);
    });
  });

  describe("6. Keyboard interaction", () => {
    it("sends on Enter key", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      const input = screen.getByTestId("chat-input");
      await userEvent.type(input, "Hello");
      await userEvent.keyboard("{Enter}");

      await waitFor(() => expect(capturedRequests.length).toBe(1));
    });

    it("does NOT send on Shift+Enter", async () => {
      const capturedRequests: ChatRequest[] = [];
      const adapter = makeMockAdapter({ capturedRequests });
      render(<RenderWithSession session={baselineSession} adapter={adapter} />);

      const input = screen.getByTestId("chat-input");
      await userEvent.type(input, "Hello");
      await userEvent.keyboard("{Shift>}{Enter}{/Shift}");

      // Give a tick for any spurious async effects.
      await new Promise((r) => setTimeout(r, 50));
      expect(capturedRequests.length).toBe(0);
    });
  });

  describe("7. Control-panel mutation / system messages", () => {
    it("displays a system message when the state contains one", () => {
      const sessionWithSystemMsg: SessionState = {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: [
            {
              id: "sys-mutation-001",
              content: "Agent persona changed to analytical",
              timestamp: Date.now(),
              sender: "system",
            },
          ],
        },
      };

      render(<RenderWithSession session={sessionWithSystemMsg} />);

      const systemMessages = screen.getAllByTestId("chat-message-system");
      expect(systemMessages.length).toBeGreaterThanOrEqual(1);
      expect(systemMessages[0]).toHaveTextContent("Agent persona changed to analytical");
    });

    it("renders system messages alongside user/agent messages", () => {
      const mixed: SessionState = {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: [
            {
              id: "u1",
              content: "Hello",
              timestamp: Date.now() - 3000,
              sender: "user",
            },
            {
              id: "sys1",
              content: "Lighting changed to dim",
              timestamp: Date.now() - 2000,
              sender: "system",
            },
            {
              id: "a1",
              content: "Noted the lighting change",
              timestamp: Date.now() - 1000,
              sender: "agent",
            },
          ],
        },
      };

      render(<RenderWithSession session={mixed} />);

      expect(screen.getByTestId("chat-message-user")).toBeInTheDocument();
      expect(screen.getByTestId("chat-message-system")).toBeInTheDocument();
      expect(screen.getByTestId("chat-message-agent")).toBeInTheDocument();
    });
  });

  describe("8. No environment mutation", () => {
    it("does not dispatch environment actions when sending a message", async () => {
      const dispatchSpy = vi.fn();
      const realReducer = (state: SessionState, action: unknown) => {
        dispatchSpy(action);
        return reducer(state, action as Parameters<typeof reducer>[1]);
      };

      function SpySession({ children }: { children: ReactNode }) {
        const [state, dispatch] = useReducer(realReducer, baselineSession);
        return (
          <SessionContext.Provider value={{ state, dispatch }}>
            {children}
          </SessionContext.Provider>
        );
      }

      const adapter = makeMockAdapter();
      render(
        <SpySession>
          <ChatPanel adapter={adapter} />
        </SpySession>,
      );

      await userEvent.type(screen.getByTestId("chat-input"), "Hello");
      await userEvent.click(screen.getByTestId("chat-send-btn"));

      await waitFor(() =>
        expect(screen.getByTestId("chat-message-agent")).toBeInTheDocument(),
      );

      // Verify no environment or agent mutation was dispatched.
      const dispatchedTypes = dispatchSpy.mock.calls.map(
        (args: [{ type: string }]) => args[0].type,
      );
      const forbiddenPrefixes = [
        "session/agent_identity_change",
        "session/agent_behavior_change",
        "session/agent_appearance_change",
        "session/environment_preset_change",
        "session/object_toggle",
      ];
      for (const type of dispatchedTypes) {
        expect(forbiddenPrefixes).not.toContain(type);
      }
    });
  });
});
