import {
  AgentState,
  BehaviorState,
  EnvironmentState,
  ChatMessage,
  MutationRecord,
} from "./sessionTypes";

// ── Action type constants ─────────────────────────────────────────────────────

export const SET_AGENT_IDENTITY_CHANGE = "session/agent_identity_change" as const;
export const SET_AGENT_BEHAVIOR_CHANGE = "session/agent_behavior_change" as const;
export const SET_AGENT_APPEARANCE_CHANGE = "session/agent_appearance_change" as const;
export const SET_AGENT_FULL_CHANGE = "session/agent_full_change" as const;
export const SET_ENVIRONMENT_PRESET_CHANGE = "session/environment_preset_change" as const;
export const SET_OBJECT_TOGGLE = "session/object_toggle" as const;
export const MOVE_OBJECT = "session/object_move" as const;
export const APPEND_CHAT_MESSAGE = "session/chat_append" as const;
export const UPDATE_CHAT_MESSAGE = "session/chat_update" as const;
export const APPEND_MUTATION = "session/mutation_append" as const;
export const SET_PENDING_ERROR = "session/pending_error" as const;
export const SET_PENDING_MESSAGE_ID = "session/pending_message_id" as const;
export const SET_SELECTED_OBJECT = "session/selected_object_change" as const;
export const RESET_SESSION = "session/reset_baseline" as const;

// ── Action type union ─────────────────────────────────────────────────────────

export type SessionAction =
  | ReturnType<typeof setAgentIdentity>
  | ReturnType<typeof setAgentBehavior>
  | ReturnType<typeof setAgentAppearance>
  | ReturnType<typeof setAgentFull>
  | ReturnType<typeof setEnvironmentPreset>
  | ReturnType<typeof toggleObjectEnabled>
  | ReturnType<typeof moveObject>
  | ReturnType<typeof appendChatMessage>
  | ReturnType<typeof updateChatMessage>
  | ReturnType<typeof appendMutation>
  | ReturnType<typeof setPendingError>
  | ReturnType<typeof setPendingMessageId>
  | ReturnType<typeof setSelectedObject>
  | ReturnType<typeof resetSession>;

// ── Action creators ───────────────────────────────────────────────────────────

export const setAgentIdentity = (
  updates: Partial<Omit<AgentState, "behavior" | "appearance">>,
) => ({
  type: SET_AGENT_IDENTITY_CHANGE,
  payload: updates,
});

export const setAgentBehavior = (updates: Partial<BehaviorState>) => ({
  type: SET_AGENT_BEHAVIOR_CHANGE,
  payload: updates,
});

export const setAgentAppearance = (updates: Partial<AgentState["appearance"]>) => ({
  type: SET_AGENT_APPEARANCE_CHANGE,
  payload: updates,
});

/**
 * Atomically replace all mutable agent fields (identity + behavior + appearance)
 * in one dispatch — used by the Apply Agent Changes flow so a single state
 * transition covers the whole apply action.
 */
export const setAgentFull = (updates: Partial<Omit<AgentState, "id">>) => ({
  type: SET_AGENT_FULL_CHANGE,
  payload: updates,
});

export const setEnvironmentPreset = (
  updates: Partial<Omit<EnvironmentState, "objects">>,
) => ({
  type: SET_ENVIRONMENT_PRESET_CHANGE,
  payload: updates,
});

export const toggleObjectEnabled = (id: string, enabled: boolean) => ({
  type: SET_OBJECT_TOGGLE,
  payload: { id, enabled },
});

/**
 * Update the world-space position of a specific scene object.
 *
 * This action is dispatched after a successful collider-aware placement
 * validation. Do NOT mutate Three.js scene objects directly — always go
 * through this action so the renderer reads the updated position from state.
 */
export const moveObject = (
  id: string,
  position: { x: number; y: number; z: number },
) => ({
  type: MOVE_OBJECT,
  payload: { id, position },
});

export const appendChatMessage = (message: ChatMessage) => ({
  type: APPEND_CHAT_MESSAGE,
  payload: { message },
});

/** Update an existing chat message by ID (e.g., to set agent response text). */
export const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => ({
  type: UPDATE_CHAT_MESSAGE,
  payload: { id, updates },
});

export const appendMutation = (mutation: MutationRecord) => ({
  type: APPEND_MUTATION,
  payload: { mutation },
});

export const setPendingError = (error: string | undefined) => ({
  type: SET_PENDING_ERROR,
  payload: { error },
});

export const setPendingMessageId = (id: string | undefined) => ({
  type: SET_PENDING_MESSAGE_ID,
  payload: { id },
});

export const setSelectedObject = (id: string | undefined) => ({
  type: SET_SELECTED_OBJECT,
  payload: { id },
});

export const resetSession = () => ({
  type: RESET_SESSION,
});
