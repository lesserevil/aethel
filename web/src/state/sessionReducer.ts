import { SessionState, AgentState } from "./sessionTypes";
import { baselineSession } from "./baselineSession";
import { SessionAction } from "./sessionActions";

/**
 * Pure reducer for session state.
 *
 * All state transitions are immutable – each case spreads the previous state
 * (or its nested objects) and returns a new object reference. The baseline
 * session is used as the initial state and as the reset target.
 */
export const reducer = (
  state: SessionState = baselineSession,
  action: SessionAction,
): SessionState => {
  switch (action.type) {
    case "session/agent_identity_change": {
      return {
        ...state,
        agent: { ...state.agent, ...action.payload },
      };
    }

    case "session/agent_behavior_change": {
      return {
        ...state,
        agent: {
          ...state.agent,
          behavior: { ...state.agent.behavior, ...action.payload },
        },
      };
    }

    case "session/agent_appearance_change": {
      return {
        ...state,
        agent: {
          ...state.agent,
          appearance: { ...state.agent.appearance, ...action.payload },
        },
      };
    }

    case "session/agent_full_change": {
      // Single-dispatch full agent update used by the Apply Agent Changes flow.
      // Deep-merge nested behavior and appearance so callers can pass partial objects.
      const payload = action.payload as Partial<Omit<AgentState, "id">>;
      return {
        ...state,
        agent: {
          ...state.agent,
          ...payload,
          behavior: {
            ...state.agent.behavior,
            ...(payload.behavior ?? {}),
          },
          appearance: {
            ...state.agent.appearance,
            ...(payload.appearance ?? {}),
          },
        },
      };
    }

    case "session/environment_preset_change": {
      return {
        ...state,
        environment: { ...state.environment, ...action.payload },
      };
    }

    case "session/object_toggle": {
      const { id, enabled } = action.payload;
      return {
        ...state,
        environment: {
          ...state.environment,
          objects: state.environment.objects.map((obj) =>
            obj.id === id ? { ...obj, enabled } : obj,
          ),
        },
      };
    }

    case "session/chat_append": {
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, action.payload.message],
        },
      };
    }

    case "session/chat_update": {
      const { id, updates } = action.payload;
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: state.chat.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg,
          ),
        },
      };
    }

    case "session/mutation_append": {
      return {
        ...state,
        mutations: [...state.mutations, action.payload.mutation],
      };
    }

    case "session/pending_error": {
      return {
        ...state,
        chat: { ...state.chat, error: action.payload.error },
      };
    }

    case "session/pending_message_id": {
      return {
        ...state,
        chat: { ...state.chat, pendingMessageId: action.payload.id },
      };
    }

    case "session/selected_object_change": {
      return {
        ...state,
        ui: { ...state.ui, selectedObjectId: action.payload.id },
      };
    }

    case "session/reset_baseline": {
      // Preserve chat message history – do NOT erase it during a scene reset.
      const preservedMessages = state.chat.messages;
      return {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: preservedMessages,
        },
      };
    }

    default: {
      // Exhaustive check: TypeScript will warn if a case is missing.
      return state;
    }
  }
};
