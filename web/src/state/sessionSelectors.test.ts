import { SessionState } from './sessionTypes';
import { selectChatContext, selectRendererProps } from './sessionSelectors';

describe('SessionSelectors', () => {
  const dummyState: SessionState = {
    sessionId: 'test-session',
    agent: {
      id: 'agent-001',
      displayName: 'Test Agent',
      personaPreset: 'helpful',
      tone: 'friendly',
      behavior: { curiosity: 0.5, formality: 0.5, skepticism: 0.5 },
      appearance: { avatarPreset: 'humanoid', accentColor: '#4CC9F0', idlePose: 'standing' }
    },
    environment: {
      preset: 'laboratory',
      timeOfDay: 'day',
      lighting: 'bright',
      ambience: 'peaceful',
      weather: 'clear',
      objects: []
    },
    chat: {
      messages: [],
      pendingMessageId: undefined,
      error: undefined
    },
    mutations: [],
    ui: {
      selectedPanel: 'controls',
      activeControlTab: 'agent',
      pendingRequestIds: [],
      selectedObjectId: undefined
    }
  };

  test('selectChatContext returns correct chat data', () => {
    const result = selectChatContext(dummyState);
    expect(result.messages).toEqual(dummyState.chat.messages);
    expect(result.pendingMessageId).toBe(dummyState.chat.pendingMessageId);
    expect(result.error).toBe(dummyState.chat.error);
  });

  test('selectRendererProps returns correct renderer props', () => {
    const result = selectRendererProps(dummyState);
    expect(result.agent).toEqual(dummyState.agent);
    expect(result.environment).toEqual(dummyState.environment);
    expect(result.selectedObjectId).toBe(dummyState.ui.selectedObjectId);
  });

  test('selectRendererProps does not mutate state', () => {
    const before = dummyState.ui.selectedObjectId;
    const result = selectRendererProps(dummyState);
    expect(result.selectedObjectId).toBeUndefined();
    // Ensure original state unchanged
    expect(dummyState.ui.selectedObjectId).toBeUndefined();
  });
});