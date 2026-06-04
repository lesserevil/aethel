import { SessionState, ChatMessage, MutationRecord } from "./sessionTypes";
import { createMutationRecord } from "./mutationLog";

/**
 * Builds a ChatContext object from session state.
 * This ensures components get a stable, read-only view of chat data.
 */
export const selectChatContext = (
  state: SessionState,
): {
  messages: ChatMessage[];
  pendingMessageId?: string;
  error?: string;
} => ({
  messages: state.chat.messages,
  pendingMessageId: state.chat.pendingMessageId,
  error: state.chat.error,
});

/**
 * Builds renderer props needed by the 3D viewport.
 * This selector isolates presentation logic from state mutations.
 */
export const selectRendererProps = (state: SessionState) => ({
  agent: state.agent,
  environment: state.environment,
  selectedObjectId: state.ui.selectedObjectId,
});

/**
 * Helper to create a MutationRecord entry with consistent shape.
 */
export const createMutationHelper = ({
  source,
  target,
  summary,
  status,
  payload,
  timestamp,
  idGenerator,
}: {
  source: string;
  target: string;
  summary: string;
  status: "pending" | "applied" | "failed";
  payload?: Record<string, unknown>;
  timestamp?: number;
  idGenerator?: () => string;
}) => {
  return createMutationRecord({
    source,
    target,
    summary,
    status,
    payload,
    timestamp,
    idGenerator,
  });
};
