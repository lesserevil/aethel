import {
  SessionState,
  ChatMessage,
  MutationSource,
  MutationTarget,
  MutationStatus,
} from "./sessionTypes";
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
 * Usage: const mr = createMutationHelper({source: 'control-panel', target: 'agent', summary: 'Changed tone', status: 'applied'});
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
  source: MutationSource;
  target: MutationTarget;
  summary: string;
  status: MutationStatus;
  payload?: Record<string, unknown>;
  timestamp?: number;
  idGenerator?: () => string;
}) => {
  // Leveraging the existing createMutationRecord to keep consistent IDs/timestamps
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
