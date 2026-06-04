import { SessionState, AgentState, SceneObjectState } from "./sessionTypes";
import { baselineSession } from "./baselineSession";

// Reducer function that handles all action types.
// The action parameter is `any` because a full discriminated-union type would
// require exporting every action shape; that can be tightened incrementally.
export const reducer = (
  state: SessionState = baselineSession,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any,
): SessionState => {
  // Switch based on action type
  switch (action.type) {
    case "session/agent_identity_change": {
      return {
        ...state,
        agent: {
          ...state.agent,
          ...action.payload,
        },
      };
    }
    case "session/agent_behavior_change": {
      return {
        ...state,
        agent: {
          ...state.agent,
          behavior: {
            ...state.agent.behavior,
            ...action.payload,
          },
        },
      };
    }
    case "session/agent_appearance_change": {
      return {
        ...state,
        agent: {
          ...state.agent,
          appearance: {
            ...state.agent.appearance,
            ...action.payload,
          },
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
        environment: {
          ...state.environment,
          ...action.payload,
        },
      };
    }
    case "session/object_toggle": {
      const { id, enabled } = action.payload;
      const updatedObjects = state.environment.objects.map((obj: SceneObjectState) => {
        if (obj.id === id) {
          return { ...obj, enabled };
        }
        return obj;
      });
      return {
        ...state,
        environment: {
          ...state.environment,
          objects: updatedObjects,
        },
      };
    }
    case "session/chat_append": {
      const newMessage = action.payload.message;
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, newMessage],
        },
      };
    }
    case "session/mutation_append": {
      const newMutation = action.payload.mutation;
      return {
        ...state,
        mutations: [...state.mutations, newMutation],
      };
    }
    case "session/pending_error": {
      return {
        ...state,
        chat: {
          ...state.chat,
          error: action.payload.error,
        },
      };
    }
    case "session/selected_object_change": {
      const { id } = action.payload;
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedObjectId: id,
        },
      };
    }
    case "session/reset_baseline": {
      // Preserve chat message history to avoid erasing it
      const preservedMessages = state.chat.messages;
      return {
        ...baselineSession,
        chat: {
          ...baselineSession.chat,
          messages: preservedMessages, // Keep existing chat messages
        },
      };
    }
    default: {
      return state;
    }
  }
};
