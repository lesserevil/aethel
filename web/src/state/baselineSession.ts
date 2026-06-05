import { SessionState } from "./sessionTypes";

/**
 * Baseline session fixture for MVP.
 * Includes one default agent, a standard office environment preset with the
 * full MVP prop set (desk, chair, monitor, laptop, keyboard, trash can, lamp,
 * and three clutter objects), empty chat history, and no applied mutations.
 *
 * Each scene object carries an `assetId` that references an entry in
 * `officeAssetManifest.ts`. The renderer uses this ID to load the local GLB;
 * absent `assetId` means procedural fallback geometry.
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
      // ── Furniture ──────────────────────────────────────────────────────────
      {
        id: "obj-001",
        label: "Workstation",
        type: "desk",
        enabled: true,
        assetId: "office-desk",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
        affordances: ["work-surface"],
      },
      {
        id: "obj-002",
        label: "Office Chair",
        type: "chair",
        enabled: true,
        assetId: "office-chair",
        position: { x: 0, y: 0, z: 0.9 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
        affordances: ["seatable"],
      },
      // ── Devices ────────────────────────────────────────────────────────────
      {
        id: "obj-003",
        label: "Monitor",
        type: "monitor",
        enabled: true,
        assetId: "office-monitor",
        position: { x: 0.1, y: 0.76, z: -0.25 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
      },
      {
        id: "obj-004",
        label: "Laptop",
        type: "laptop",
        enabled: true,
        assetId: "office-laptop",
        position: { x: -0.3, y: 0.76, z: 0.05 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
        affordances: ["input-device"],
      },
      {
        id: "obj-005",
        label: "Keyboard",
        type: "keyboard",
        enabled: true,
        assetId: "office-keyboard",
        position: { x: 0, y: 0.76, z: 0.15 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
        affordances: ["input-device"],
      },
      // ── Container ──────────────────────────────────────────────────────────
      {
        id: "obj-006",
        label: "Trash Can",
        type: "trash-can",
        enabled: true,
        assetId: "office-trash-can",
        position: { x: 0.8, y: 0, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "cylinder" },
        affordances: ["waste-container"],
      },
      // ── Desk accessories ───────────────────────────────────────────────────
      {
        id: "obj-007",
        label: "Desk Lamp",
        type: "lamp",
        enabled: true,
        assetId: "office-desk-lamp",
        position: { x: 0.5, y: 0.76, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "convexHull" },
        affordances: ["light-source"],
      },
      // ── Clutter ────────────────────────────────────────────────────────────
      {
        id: "obj-008",
        label: "Book Stack",
        type: "books",
        enabled: true,
        assetId: "office-book-stack",
        position: { x: 0.4, y: 0.76, z: -0.1 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
      },
      {
        id: "obj-009",
        label: "Coffee Cup",
        type: "cup",
        enabled: true,
        assetId: "office-coffee-cup",
        position: { x: -0.4, y: 0.76, z: 0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "cylinder" },
      },
      {
        id: "obj-010",
        label: "Notebook",
        type: "notebook",
        enabled: true,
        assetId: "office-notebook",
        position: { x: 0.2, y: 0.76, z: 0.25 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        collider: { hint: "box" },
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
