import { reducer } from './sessionReducer';
import { setAgentIdentity, setAgentBehavior, setAgentAppearance, 
         setEnvironmentPreset, toggleObjectEnabled, appendChatMessage, 
         appendMutation, setPendingError, setSelectedObject, resetSession } from './sessionActions';
import { SessionState } from './sessionTypes';
import { MutationRecord, ChatMessage } from './sessionTypes';
import { baselineSession } from './baselineSession';

describe('SessionReducer', () => {
  let initialState: SessionState;

  beforeEach(() => {
    initialState = JSON.parse(JSON.stringify(baselineSession));
  });

  test('SET_AGENT_IDENTITY_CHANGE updates agent identity fields', () => {
    const action = setAgentIdentity({
      displayName: 'Test Agent',
      personaPreset: 'analytical'
    });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.displayName).toBe('Test Agent');
    expect(nextState.agent.personaPreset).toBe('analytical');
    // Ensure other agent fields are unchanged
    expect(nextState.agent.behavior.curiosity).toBe(0.7);
  });

  test('SET_AGENT_BEHAVIOR_CHANGE updates behavior values', () => {
    const action = setAgentBehavior({
      curiosity: 0.9,
      formality: 0.2
    });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.behavior.curiosity).toBe(0.9);
    expect(nextState.agent.behavior.formality).toBe(0.2);
    // Ensure other behavior fields stay the same
    expect(nextState.agent.behavior.skepticism).toBe(0.3);
    expect(nextState.agent.displayName).toBe('Aethel Agent');
  });

  test('SET_AGENT_APPEARANCE_CHANGE updates appearance fields', () => {
    const action = setAgentAppearance({
      avatarPreset: 'abstract',
      accentColor: '#FF0000'
    });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.appearance.avatarPreset).toBe('abstract');
    expect(nextState.agent.appearance.accentColor).toBe('#FF0000');
    // Ensure other appearance fields are unchanged
    expect(nextState.agent.appearance.idlePose).toBe('standing');
  });

  test('SET_ENVIRONMENT_Preset_CHANGE changes environment preset', () => {
    const action = setEnvironmentPreset({
      preset: 'outdoor',
      lighting: 'dim'
    });
    const nextState = reducer(initialState, action);
    expect(nextState.environment.preset).toBe('outdoor');
    expect(nextState.environment.lighting).toBe('dim');
    // Ensure other env fields remain unchanged
    expect(nextState.environment.timeOfDay).toBe('day');
  });

  test('SET_OBJECT_TOGGLE enables/disables a specific object', () => {
    const action = toggleObjectEnabled('obj-002', false);
    const nextState = reducer(initialState, action);
    const toggledObj = nextState.environment.objects.find(o => o.id === 'obj-002');
    expect(toggledObj.enabled).toBe(false);
    // Ensure other objects unchanged
    const otherObj = nextState.environment.objects.find(o => o.id === 'obj-001');
    expect(otherObj.enabled).toBe(true);
  });

  test('APPEND_CHAT_MESSAGE adds message to chat history', () => {
    const message: ChatMessage = {
      id: 'msg-999',
      content: 'Appended message',
      timestamp: Date.now(),
      sender: 'user',
      metadata: {}
    };
    const action = appendChatMessage(message);
    const nextState = reducer(initialState, action);
    expect(nextState.chat.messages).toContain(message);
    expect(nextState.chat.messages.length).toBe(1);
  });

  test('APPEND_MUTATION adds mutation record to mutations array', () => {
    const mutation: MutationRecord = {
      id: 'mr-test-1',
      timestamp: 123456,
      source: 'control-panel',
      target: 'agent',
      summary: 'Test mutation',
      status: 'applied',
      payload: { changedField: 'value' }
    };
    const action = appendMutation(mutation);
    const nextState = reducer(initialState, action);
    // Use length check and deep equality instead of toContain (reference based)
    expect(nextState.mutations).toHaveLength(1);
    expect(nextState.mutations[0]).toEqual(mutation);
  });

  test('SET_PENDING_ERROR stores error message', () => {
    const action = setPendingError('Network error');
    const nextState = reducer(initialState, action);
    expect(nextState.chat.error).toBe('Network error');
  });

  test('SET_SELECTED_OBJECT_CHANGE updates selectedObjectId', () => {
    const action = setSelectedObject('obj-003');
    const nextState = reducer(initialState, action);
    expect(nextState.ui.selectedObjectId).toBe('obj-003');
  });

  test('RESET_SESSION preserves chat history while resetting other state', () => {
    // First modify some state to simulate changes
    const modifiedState = {
      ...initialState,
      agent: { ...initialState.agent, displayName: 'Modified Name' },
      chat: { ...initialState.chat, messages: ['msg-001', 'msg-002'] }
    };
    // Now dispatch reset action on modified state
    const action = resetSession();
    const resetState = reducer(modifiedState, action);
    // Reset should restore baseline values for all fields except chat messages
    expect(resetState.agent.displayName).toBe('Aethel Agent'); // reset to baseline
    expect(resetState.chat.messages.length).toBe(2); // chat messages should be preserved
    expect(resetState.chat.messages[0]).toBe('msg-001'); // messages from modified state preserved
  });

  test('UNKNOWN action returns unchanged state', () => {
    const unknownAction = { type: 'unknown/action', payload: {} };
    const nextState = reducer(initialState, unknownAction);
    // Should be same reference or equal object
    expect(nextState).toEqual(initialState);
  });
});