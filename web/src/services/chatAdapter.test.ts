import { describe, it, expect } from "vitest";
import { mockChatAdapter, ChatError } from "./chatAdapter";

function mockAgentState() {
  return {
    id: "agent-001",
    displayName: "TestAgent",
    personaPreset: "helpful",
    tone: "friendly",
    behavior: { curiosity: 0.5, formality: 0.3, skepticism: 0.1 },
    appearance: { avatarPreset: "robot", accentColor: "#fff", idlePose: "standing" },
  };
}

function mockEnvState() {
  return {
    preset: "office",
    timeOfDay: "afternoon",
    lighting: "bright",
    ambience: "quiet",
    weather: "clear",
    objects: [],
  };
}

function mockRecentMessages() {
  return [
    {
      id: "msg-1",
      content: "Hello",
      timestamp: 12345,
      sender: "user",
      metadata: undefined,
    },
  ];
}

describe("mockChatAdapter", () => {
  it("throws ChatError when required fields are missing", async () => {
    const adapter = mockChatAdapter;
    const request = {
      sessionId: "test-session",
      userMessage: "Hello",
      agentState: mockAgentState(),
      environmentState: mockEnvState(),
      recentMessages: mockRecentMessages(),
    };
    // Remove a required field to trigger validation error
    const badRequest = { ...request, sessionId: "" };
    await expect(adapter.send(badRequest)).rejects.toThrow("sessionId is required");
  });

  it("returns a response referencing agent displayName and environment preset", async () => {
    const adapter = mockChatAdapter;
    const request = {
      sessionId: "test-session",
      userMessage: "What is your name?",
      agentState: mockAgentState(),
      environmentState: mockEnvState(),
      recentMessages: mockRecentMessages(),
    };
    const response = await adapter.send(request);
    expect(response.response).toContain("TestAgent");
    expect(response.response).toContain("helpful");
    expect(response.response).toContain("office");
  });

  it("includes snippet of recent user message in response", async () => {
    const adapter = mockChatAdapter;
    const recentMessages = [
      {
        id: "msg-2",
        content: "Tell me about the lighting",
        timestamp: 12345,
        sender: "user",
        metadata: undefined,
      },
    ];
    const request = {
      sessionId: "test-session",
      userMessage: "Tell me about the scene",
      agentState: mockAgentState(),
      environmentState: mockEnvState(),
      recentMessages,
    };
    const response = await adapter.send(request);
    expect(response.response).toContain("Tell me about the lighting");
  });

  it("supports AbortSignal cancellation", async () => {
    const adapter = mockChatAdapter;
    const controller = new AbortController();
    controller.abort();
    const request = {
      sessionId: "test-session",
      userMessage: "test",
      agentState: mockAgentState(),
      environmentState: mockEnvState(),
      recentMessages: mockRecentMessages(),
    };
    await expect(adapter.send(request, controller.signal)).rejects.toThrow(
      "Request aborted",
    );
  });

  it('does not mutate agentState, environmentState, or recentMessages', async () => {
    const adapter = mockChatAdapter;
    const agentState = mockAgentState();
    const environmentState = mockEnvState();
    const recentMessages = mockRecentMessages();

    // Deep-copy initial state for comparison
    const agentStateBefore = JSON.parse(JSON.stringify(agentState));
    const envStateBefore = JSON.parse(JSON.stringify(environmentState));
    const messagesBefore = JSON.parse(JSON.stringify(recentMessages));

    const request = {
      sessionId: 'test-session',
      userMessage: 'Will you mutate state?',
      agentState,
      environmentState,
      recentMessages,
    };

    await adapter.send(request);

    // Verify none of the passed objects were mutated
    expect(agentState).toEqual(agentStateBefore);
    expect(environmentState).toEqual(envStateBefore);
    expect(recentMessages).toEqual(messagesBefore);
  });

  it('returns a ChatError instance when throwing on validation failure', async () => {
    const adapter = mockChatAdapter;
    const request = {
      sessionId: 'test-session',
      userMessage: '',
      agentState: mockAgentState(),
      environmentState: mockEnvState(),
      recentMessages: mockRecentMessages(),
    };
    try {
      await adapter.send(request);
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ChatError);
      expect((err as ChatError).name).toBe('ChatError');
    }
  });
});
