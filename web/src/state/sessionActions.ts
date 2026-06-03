import { AgentState, BehaviorState, EnvironmentState, SceneObjectState, ChatState, MutationRecord, UiState } from './sessionTypes';

// Action type definitions
export const SET_AGENT_IDENTITY_CHANGE = 'session/agent_identity_change';
export const SET_AGENT_BEHAVIOR_CHANGE = 'session/agent_behavior_change';
export const SET_AGENT_APPEARANCE_CHANGE = 'session/agent_appearance_change';
export const SET_ENVIRONMENT_Preset_CHANGE = 'session/environment_preset_change';
export const SET_OBJECT_TOGGLE = 'session/object_toggle';
export const APPEND_CHAT_MESSAGE = 'session/chat_append';
export const APPEND_MUTATION = 'session/mutation_append';
export const SET_PENDING_ERROR = 'session/pending_error';
export const SET_SELECTED_OBJECT = 'session/selected_object_change';
export const RESET_SESSION = 'session/reset_baseline';

// Action creators
export const setAgentIdentity = (updates: Partial<AgentState>) => ({
  type: SET_AGENT_IDENTITY_CHANGE as const,
  payload: updates
});

export const setAgentBehavior = (updates: Partial<BehaviorState>) => ({
  type: SET_AGENT_BEHAVIOR_CHANGE as const,
  payload: updates
});

export const setAgentAppearance = (updates: Partial<AgentState['appearance']>) => ({
  type: SET_AGENT_APPEARANCE_CHANGE as const,
  payload: updates
});

export const setEnvironmentPreset = (updates: Partial<EnvironmentState>) => ({
  type: SET_ENVIRONMENT_Preset_CHANGE as const,
  payload: updates
});

export const toggleObjectEnabled = (id: string, enabled: boolean) => ({
  type: SET_OBJECT_TOGGLE as const,
  payload: { id, enabled }
});

export const appendChatMessage = (message: ChatMessage) => ({
  type: APPEND_CHAT_MESSAGE as const,
  payload: { message }
});

export const appendMutation = (mutation: MutationRecord) => ({
  type: APPEND_MUTATION as const,
  payload: { mutation }
});

export const setPendingError = (error: string | undefined) => ({
  type: SET_PENDING_ERROR as const,
  payload: { error }
});

export const setSelectedObject = (id: string | undefined) => ({
  type: SET_SELECTED_OBJECT as const,
  payload: { id }
});

export const resetSession = () => ({
  type: RESET_SESSION as const,
});