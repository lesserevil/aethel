// TypeScript Interfaces for Future REST API Integration
// These interfaces define the shape of requests and responses for session and mutation APIs

/** Interface for session-related API operations */
export interface SessionAPI {
  /** Retrieve the current session state */
  getSession(): Promise<SessionState>;

  /** Save the current session state */
  saveSession(session: SessionState): Promise<void>;
}

/** Interface for mutation-related API operations */
export interface MutationAPI {
  /**
   * Submit a mutation request with the given payload.
   * In the MVP, this may be a no-op or mock implementation.
   * @param payload Mutation payload to send
   * @returns The created MutationRecord
   */
  mutate(payload: Record<string, unknown>): Promise<MutationRecord>;
}

/** Shape of a control panel mutation payload for REST */
export interface ControlPanelMutationPayload {
  source: 'control-panel' | 'chat-confirmed' | 'system';
  target: 'agent' | 'environment' | 'session' | 'chat';
  summary: string;
  status: 'pending' | 'applied' | 'failed';
  payload?: Record<string, unknown>;
}