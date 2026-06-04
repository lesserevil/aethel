// ChatPanel.tsx
// Right column conversation surface for the Aethel MVP.
//
// Renders the full message history (user, agent, system/context messages),
// a text input, a send button, pending state while the adapter is working,
// and an inline error banner when the adapter fails.
//
// The component does NOT mutate the environment; it only appends chat
// messages via the session reducer.

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { useSessionState, useSessionDispatch } from "../state/SessionProvider";
import { appendChatMessage, setPendingError } from "../state/sessionActions";
import type { ChatAdapter } from "../services/chatAdapter";
import { mockChatAdapter } from "../services/chatAdapter";
import type { ChatMessage } from "../state/sessionTypes";
import "./chat-panel.css";

export interface ChatPanelProps {
  /**
   * Chat adapter to use for sending messages.
   * Defaults to the deterministic in-browser mock adapter.
   * Inject a different adapter in tests or when connecting to a real backend.
   */
  adapter?: ChatAdapter;
}

/**
 * ChatPanel — right-column conversation surface.
 *
 * - Reads chat history and error state from session state.
 * - On send: appends the user message, calls the adapter with full session
 *   context (sessionId, agentState, environmentState, recentMessages), shows
 *   a pending indicator, then appends the agent response.
 * - On adapter error: stores the error message in state without removing history.
 * - Duplicate sends are blocked while a request is in-flight.
 */
export function ChatPanel({ adapter = mockChatAdapter }: ChatPanelProps) {
  const state = useSessionState();
  const dispatch = useSessionDispatch();
  const { messages, error } = state.chat;

  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the newest message whenever the list changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isPending) return;

    // Build and append the user message immediately.
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      content: text,
      timestamp: Date.now(),
      sender: "user",
    };
    dispatch(appendChatMessage(userMessage));
    setInputValue("");

    // Clear any previous error and mark the request as pending.
    dispatch(setPendingError(undefined));
    setIsPending(true);

    // Abort any existing in-flight request before starting a new one.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const chatResponse = await adapter.send(
        {
          sessionId: state.sessionId,
          userMessage: text,
          agentState: state.agent,
          environmentState: state.environment,
          // Pass the full message list including the message we just appended.
          recentMessages: [...messages, userMessage],
        },
        controller.signal,
      );

      // Only update state if this request was not aborted.
      if (!controller.signal.aborted) {
        const agentMessage: ChatMessage = {
          id: chatResponse.newMessageId,
          content: chatResponse.response,
          timestamp: Date.now(),
          sender: "agent",
          metadata: { agentId: state.agent.id },
        };
        dispatch(appendChatMessage(agentMessage));
      }
    } catch (err) {
      // Preserve history — only store the error string.
      if (!controller.signal.aborted) {
        const errMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        dispatch(setPendingError(errMessage));
      }
    } finally {
      // Only clear pending when the request that set it has finished.
      if (!controller.signal.aborted) {
        setIsPending(false);
      }
    }
  }, [inputValue, isPending, adapter, state, messages, dispatch]);

  // Submit on Enter; Shift+Enter inserts a newline.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="chat-panel" data-testid="chat-panel-root">
      {/* ── Message history ── */}
      <div
        className="chat-panel__messages"
        data-testid="chat-messages"
        role="log"
        aria-label="Conversation history"
        aria-live="polite"
      >
        {messages.length === 0 && !isPending && (
          <p className="chat-panel__empty" data-testid="chat-empty">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg: ChatMessage) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {/* Pending indicator — visible while the adapter is working */}
        {isPending && (
          <div
            className="chat-panel__pending"
            data-testid="chat-pending"
            role="status"
            aria-label="Agent is responding"
          >
            <span className="chat-panel__pending-dot" />
            <span className="chat-panel__pending-dot" />
            <span className="chat-panel__pending-dot" />
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          className="chat-panel__error"
          data-testid="chat-error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="chat-panel__input-area">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          className="chat-panel__input"
          data-testid="chat-input"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={3}
          value={inputValue}
          disabled={isPending}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message input"
          aria-disabled={isPending}
        />
        <button
          type="button"
          className="chat-panel__send-btn"
          data-testid="chat-send-btn"
          onClick={handleSend}
          disabled={isPending || inputValue.trim().length === 0}
          aria-label="Send message"
        >
          {isPending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ── Internal helper component ──────────────────────────────────────────────

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const senderLabel =
    message.sender === "user" ? "You" : message.sender === "agent" ? "Agent" : "System";

  return (
    <div
      className={`chat-panel__message chat-panel__message--${message.sender}`}
      data-testid={`chat-message-${message.sender}`}
      data-message-id={message.id}
      role="article"
      aria-label={`${senderLabel} message`}
    >
      <span className="chat-panel__message-sender">{senderLabel}</span>
      <p className="chat-panel__message-content">{message.content}</p>
    </div>
  );
}
