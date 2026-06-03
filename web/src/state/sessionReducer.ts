import { SessionState, baselineSession } from './baselineSession';
import { setAgentIdentity, setAgentBehavior, setAgentAppearance, 
         setEnvironmentPreset, toggleObjectEnabled, appendChatMessage, 
         appendMutation, setPendingError, setSelectedObject, resetSession } from './sessionActions';
import { MutationRecord } from './sessionTypes';
import { createMutationRecord } from './mutationLog';

// Reducer function that handles all action types
export const reducer = (state: SessionState = baselineSession, action: any): SessionState => {
  // Switch based on action type
  switch (action.type) {
    case 'session/agent_identity_change': {
      return {
        ...state,
        agent: {
          ...state.agent,
          ...action.payload
        }
      };
    }
    case 'session/agent_behavior_change': {
      return {
        ...state,
        agent: {
          ...state.agent,
          behavior: {
            ...state.agent.behavior,
            ...action.payload
          }
        }
      };
    }
    case 'session/agent_appearance_change': {
      return {
        ...state,
        agent: {
          ...state.agent,
          appearance: {
            ...state.agent.appearance,
            ...action.payload
          }
        }
      };
    }
    case 'session/environment_preset_change': {
      return {
        ...state,
        environment: {
          ...state.environment,
          ...action.payload
        }
      };
    }
    case 'session/object_toggle': {
      const { id, enabled } = action.payload;
      const updatedObjects = state.environment.objects.map(obj => {
        if (obj.id === id) {
          return { ...obj, enabled };
        }
        return obj;
      });
      return {
        ...state,
        environment: {
          ...state.environment,
          objects: updatedObjects
        }
      };
    }
    case 'session/chat_append': {
      const newMessage = action.payload.message;
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: [...state.chat.messages, newMessage]
        }
      };
    }
    case 'session/mutation_append': {
      const newMutation = action.payload.mutation;
      // Ensure mutation has id and timestamp; if not, add using helper (not required for MVP)
      return {
        ...state,
        mutations: [...state.mutations, newMutation]
      };
    }
    case 'session/pending_error': {
      return {
        ...state,
        chat: {
          ...state.chat,
          error: action.payload.error
        }
      };
    }
    case 'session/selected_object_change': {
      const { id } = action.payload;
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedObjectId: id
        }
      };
    }
    case 'session/reset_baseline': {
      // Preserve chat message history to avoid erasing it
      const preservedMessages = state.chat.messages;
      const baseline = baselineSession;
      return {
        ...baseline,
        chat: {
          ...baseline.chat,
          messages: preservedMessages // Keep existing chat messages
        }
      };
    }
    default: {
      // For unknown actions, return the current state unchanged
      return state;
    }
  }
};