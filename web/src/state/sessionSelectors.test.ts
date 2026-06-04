import { SessionState, ChatMessage } from "./sessionTypes";
import {
  selectChatContext,
  selectRendererProps,
  selectChatRequestContext,
} from "./sessionSelectors";

const makeState = (overrides?: Partial<SessionState>): SessionState => ({
  sessionId: "test-session",
  agent: {
    id: "agent-001",
    displayName: "Test Agent",
    personaPreset: "helpful",
    tone: "friendly",
    behavior: { curiosity: 0.5, formality: 0.5, skepticism: 0.5 },
    appearance: {
      avatarPreset: "humanoid",
      accentColor: "#4CC9F0",
      idlePose: "standing",
    },
  },
  environment: {
    preset: "laboratory",
    timeOfDay: "day",
    lighting: "bright",
    ambience: "peaceful",
    weather: "clear",
    objects: [],
  },
  chat: {
    messages: [],
    pendingMessageId: undefined,
    error: undefined,
  },
  mutations: [],
  ui: {
    selectedPanel: "controls",
    activeControlTab: "agent",
    pendingRequestIds: [],
    selectedObjectId: undefined,
  },
  ...overrides,
});

describe("selectChatContext", () => {
  test("returns correct chat data", () => {
    const state = makeState();
    const result = selectChatContext(state);
    expect(result.messages).toEqual([]);
    expect(result.pendingMessageId).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  test("returns messages reference without copying", () => {
    const msgs: ChatMessage[] = [
      { id: "m1", content: "hi", timestamp: 1, sender: "user" },
    ];
    const state = makeState({ chat: { messages: msgs } });
    const result = selectChatContext(state);
    // Same reference – no mutation
    expect(result.messages).toBe(msgs);
  });

  test("reflects error and pendingMessageId fields", () => {
    const state = makeState({
      chat: { messages: [], error: "oops", pendingMessageId: "msg-x" },
    });
    const result = selectChatContext(state);
    expect(result.error).toBe("oops");
    expect(result.pendingMessageId).toBe("msg-x");
  });

  test("does not mutate state", () => {
    const state = makeState();
    selectChatContext(state);
    expect(state.chat.messages).toHaveLength(0);
    expect(state.chat.error).toBeUndefined();
  });
});

describe("selectRendererProps", () => {
  test("returns agent, environment, and selectedObjectId", () => {
    const state = makeState({
      ui: {
        selectedPanel: "controls",
        activeControlTab: "agent",
        pendingRequestIds: [],
        selectedObjectId: "obj-2",
      },
    });
    const result = selectRendererProps(state);
    expect(result.agent).toEqual(state.agent);
    expect(result.environment).toEqual(state.environment);
    expect(result.selectedObjectId).toBe("obj-2");
  });

  test("selectedObjectId is undefined when none is selected", () => {
    const state = makeState();
    const result = selectRendererProps(state);
    expect(result.selectedObjectId).toBeUndefined();
  });

  test("does not mutate state", () => {
    const state = makeState();
    const before = state.agent.displayName;
    selectRendererProps(state);
    expect(state.agent.displayName).toBe(before);
  });

  test("agent and environment are the same references as in state", () => {
    const state = makeState();
    const result = selectRendererProps(state);
    expect(result.agent).toBe(state.agent);
    expect(result.environment).toBe(state.environment);
  });
});

describe("selectChatRequestContext", () => {
  const msgs: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
    id: `m${i}`,
    content: `msg ${i}`,
    timestamp: i,
    sender: "user" as const,
  }));

  test("includes sessionId, agent, environment, and recentMessages", () => {
    const state = makeState();
    const ctx = selectChatRequestContext(state);
    expect(ctx.sessionId).toBe("test-session");
    expect(ctx.agent).toBe(state.agent);
    expect(ctx.environment).toBe(state.environment);
    expect(Array.isArray(ctx.recentMessages)).toBe(true);
  });

  test("limits recentMessages to last 20 by default", () => {
    const state = makeState({ chat: { messages: msgs } });
    const ctx = selectChatRequestContext(state);
    expect(ctx.recentMessages).toHaveLength(20);
    expect(ctx.recentMessages[0].id).toBe("m5"); // 25 - 20 = starts at index 5
  });

  test("respects custom maxMessages parameter", () => {
    const state = makeState({ chat: { messages: msgs } });
    const ctx = selectChatRequestContext(state, 5);
    expect(ctx.recentMessages).toHaveLength(5);
    expect(ctx.recentMessages[0].id).toBe("m20"); // last 5 of 25
  });

  test("does not mutate state.chat.messages", () => {
    const state = makeState({ chat: { messages: msgs } });
    const before = state.chat.messages.length;
    selectChatRequestContext(state);
    expect(state.chat.messages.length).toBe(before);
  });
});
