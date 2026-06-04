import {
  AgentState,
  BehaviorState,
  EnvironmentState,
  ChatMessage,
  MutationRecord,
} from "./sessionTypes";

// Action type definitions
export const SET_AGENT_IDENTITY_CHANGE = "session/agent_identity_change" as const;
export const SET_AGENT_BEHAVIOR_CHANGE = "session/agent_behavior_change" as const;
export const SET_AGENT_APPEARANCE_CHANGE = "session/agent_appearance_change" as const;
export const SET_AGENT_FULL_CHANGE = "session/agent_full_change" as const;
export const SET_ENVIRONMENT_PRESET_CHANGE = "session/environment_preset_change" as const;
export const SET_OBJECT_TOGGLE = "session/object_toggle" as const;
export const APPEND_CHAT_MESSAGE = "session/chat_append" as const;
export const APPEND_MUTATION = "session/mutation_append" as const;
export const SET_PENDING_ERROR = "session/pending_error" as const;
export const SET_SELECTED_OBJECT = "session/selected_object_change" as const;
export const RESET_SESSION = "session/reset_baseline" as const;

// Action creators
export const setAgentIdentity = (updates: Partial<AgentState>) => ({
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

export const setEnvironmentPreset = (updates: Partial<EnvironmentState>) => ({
  type: SET_ENVIRONMENT_PRESET_CHANGE,
  payload: updates,
});

export const toggleObjectEnabled = (id: string, enabled: boolean) => ({
  type: SET_OBJECT_TOGGLE,
  payload: { id, enabled },
});

export const appendChatMessage = (message: ChatMessage) => ({
  type: APPEND_CHAT_MESSAGE,
  payload: { message },
});

export const appendMutation = (mutation: MutationRecord) => ({
  type: APPEND_MUTATION,
  payload: { mutation },
});

export const setPendingError = (error: string | undefined) => ({
  type: SET_PENDING_ERROR,
  payload: { error },
});

export const setSelectedObject = (id: string | undefined) => ({
  type: SET_SELECTED_OBJECT,
  payload: { id },
});

export const resetSession = () => ({
  type: RESET_SESSION,
});
