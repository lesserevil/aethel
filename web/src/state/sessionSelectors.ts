import { SessionState, ChatMessage, AgentState, EnvironmentState } from "./sessionTypes";

// ── Chat context selector ─────────────────────────────────────────────────────

export interface ChatContext {
  messages: ChatMessage[];
  pendingMessageId?: string;
  error?: string;
}

/**
 * Returns a stable, read-only view of chat data from session state.
 * Does NOT mutate or copy the messages array – callers must not modify it.
 */
export const selectChatContext = (state: SessionState): ChatContext => ({
  messages: state.chat.messages,
  pendingMessageId: state.chat.pendingMessageId,
  error: state.chat.error,
});

// ── Renderer props selector ───────────────────────────────────────────────────

export interface RendererProps {
  agent: AgentState;
  environment: EnvironmentState;
  selectedObjectId: string | undefined;
}

/**
 * Returns the normalized props needed by the 3D viewport renderer.
 * Keeps renderer-specific fields out of session state by deriving them here.
 * Does NOT mutate state.
 */
export const selectRendererProps = (state: SessionState): RendererProps => ({
  agent: state.agent,
  environment: state.environment,
  selectedObjectId: state.ui.selectedObjectId,
});

// ── Chat-request context builder ──────────────────────────────────────────────

/**
 * Builds the context payload included in every chat adapter request.
 * Limits recent messages to the last `maxMessages` to avoid large payloads.
 *
 * Includes `selectedObjectId` and a resolved `selectedObject` (label +
 * affordances) so the chat adapter is aware of what the user has selected
 * in the 3D viewport.
 */
export const selectChatRequestContext = (state: SessionState, maxMessages = 20) => {
  const selectedObjectId = state.ui.selectedObjectId;
  const selectedObject = selectedObjectId
    ? state.environment.objects.find((o) => o.id === selectedObjectId)
    : undefined;

  return {
    sessionId: state.sessionId,
    agent: state.agent,
    environment: state.environment,
    recentMessages: state.chat.messages.slice(-maxMessages),
    // Viewport selection context — helps the agent refer to the selected prop
    selectedObjectId,
    selectedObject: selectedObject
      ? {
          id: selectedObject.id,
          label: selectedObject.label,
          type: selectedObject.type,
          affordances: selectedObject.affordances,
          assetId: selectedObject.assetId,
        }
      : undefined,
  };
};
