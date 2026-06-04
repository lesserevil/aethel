// MVP Session Domain Types
// Defines the shared session state contract for the Aethel MVP

export type SessionId = string;

// ── Primitive union types used in MutationRecord ──────────────────────────────

export type MutationSource = "control-panel" | "chat-confirmed" | "system";
export type MutationTarget = "agent" | "environment" | "session" | "chat";
export type MutationStatus = "pending" | "applied" | "failed";

// ── Core session state ────────────────────────────────────────────────────────

export interface SessionState {
  sessionId: SessionId;
  agent: AgentState;
  environment: EnvironmentState;
  chat: ChatState;
  mutations: MutationRecord[];
  ui: UiState;
}

// ── Agent state ───────────────────────────────────────────────────────────────

/** Sliced sub-type for behavior fields – useful in action creators. */
export interface BehaviorState {
  curiosity: number; // 0–1 scale
  formality: number; // 0–1 scale
  skepticism: number; // 0–1 scale
}

export interface AgentState {
  id: string;
  displayName: string;
  personaPreset: string; // e.g., "helpful", "analytical", "creative"
  tone: string; // e.g., "friendly", "formal", "casual"
  behavior: BehaviorState;
  appearance: {
    avatarPreset: string; // e.g., "robot", "humanoid", "abstract"
    accentColor: string; // CSS color string
    idlePose: string; // e.g., "standing", "waiting", "thinking"
  };
}

// ── Environment state ─────────────────────────────────────────────────────────

export interface EnvironmentState {
  preset: string; // e.g., "laboratory", "office", "outdoor"
  timeOfDay: string; // e.g., "morning", "afternoon", "evening", "night"
  lighting: string; // e.g., "bright", "dim", "natural", "dramatic"
  ambience: string; // e.g., "quiet", "busy", "peaceful", "industrial"
  weather: string; // e.g., "clear", "cloudy", "rainy", "sunny"
  objects: SceneObjectState[];
}

export interface SceneObjectState {
  id: string;
  label: string;
  type: string; // e.g., "chair", "table", "plant", "computer"
  enabled: boolean;
  /** Transform hints for the renderer (optional, plain values only). */
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number }; // degrees
  scale?: { x: number; y: number; z: number };
}

// ── Chat state ────────────────────────────────────────────────────────────────

export interface ChatState {
  messages: ChatMessage[];
  pendingMessageId?: string; // ID of the message currently being processed
  error?: string; // Error from the last failed request
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number; // Unix timestamp in milliseconds
  sender: "user" | "agent" | "system";
  metadata?: {
    agentId?: string;
    confidence?: number; // 0–1 scale
  };
}

// ── Mutation record ───────────────────────────────────────────────────────────

export interface MutationRecord {
  id: string;
  timestamp: number; // Unix timestamp in milliseconds
  source: MutationSource;
  target: MutationTarget;
  summary: string; // Human-readable description of the change
  status: MutationStatus;
  /** Typed payload for the applied change – plain JSON only. */
  payload?: Record<string, unknown>;
}

// ── UI state ──────────────────────────────────────────────────────────────────

export interface UiState {
  selectedPanel: "controls" | "chat" | "viewport";
  activeControlTab: string; // e.g., 'agent', 'environment', 'objects'
  pendingRequestIds: string[]; // IDs of requests currently in flight
  selectedObjectId?: string; // Currently selected object in the viewport
}
