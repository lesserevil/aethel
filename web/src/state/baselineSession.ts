import { SessionState } from "./sessionTypes";

/**
 * Baseline session fixture for MVP.
 * Includes one default agent, one default environment preset,
 * at least three scene objects, empty chat history, and no applied mutations.
 */
export const baselineSession: SessionState = {
  sessionId: "baseline-session-001",
  agent: {
    id: "agent-001",
    displayName: "Aethel Agent",
    personaPreset: "helpful",
    tone: "friendly",
    behavior: {
      curiosity: 0.7,
      formality: 0.5,
      skepticism: 0.3,
    },
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
    objects: [
      {
        id: "obj-001",
        label: "Workstation",
        type: "desk",
        enabled: true,
        position: { x: -2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      {
        id: "obj-002",
        label: "Display Screen",
        type: "monitor",
        enabled: true,
        position: { x: 0, y: 1.5, z: -1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      {
        id: "obj-003",
        label: "Storage Unit",
        type: "cabinet",
        enabled: true,
        position: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
    ],
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
};

/**
 * Alternative baseline with seeded chat history – useful for tests that
 * need existing messages without having to dispatch appendChatMessage actions.
 */
export const baselineSessionWithChat: SessionState = {
  ...baselineSession,
  chat: {
    ...baselineSession.chat,
    messages: [
      {
        id: "msg-001",
        content: "Hello! I am your Aethel agent. How can I assist you today?",
        timestamp: Date.now() - 10_000,
        sender: "agent",
        metadata: { agentId: "agent-001", confidence: 0.95 },
      },
      {
        id: "msg-002",
        content: "Hi there! I'm looking to understand what this system can do.",
        timestamp: Date.now() - 8_000,
        sender: "user",
      },
    ],
  },
};
