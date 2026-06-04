// Session Storage Persistence Utilities
// Handles saving and loading SessionState to/from browser storage with versioning and defensive parsing

import { SessionState } from "../state/sessionTypes";

const SESSION_STORAGE_KEY = "sessionState";
const SESSION_VERSION = 1;

/**
 * Saves the current session state to browser session storage.
 * @param session - The session state to persist
 */
export function saveSessionState(session: SessionState): void {
  try {
    const serialized = JSON.stringify({
      version: SESSION_VERSION,
      data: session,
    });
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  } catch (error) {
    console.error("[sessionStorage] Failed to save session state:", error);
    throw error;
  }
}

/**
 * Loads the session state from browser session storage with versioning and defensive parsing.
 * @returns The loaded session state, or null if loading fails or version is unsupported
 */
export function loadSessionState(): SessionState | null {
  try {
    const serialized = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!serialized) {
      return null;
    }

    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Check version compatibility
    if (parsed.version !== SESSION_VERSION) {
      console.warn(
        `[sessionStorage] Unsupported session version: ${parsed.version}, falling back to baseline`,
      );
      return null;
    }

    // Ensure data property exists and is a non-empty object
    const session = parsed.data;
    if (!session || typeof session !== "object" || Object.keys(session).length === 0) {
      return null;
    }

    // Validate that it matches SessionState structure loosely (runtime check)
    // This is a minimal check; more thorough validation could be added
    return session as SessionState;
  } catch (error) {
    console.error("[sessionStorage] Failed to load session state:", error);
    return null;
  }
}

/**
 * Clears the persisted session state from storage.
 * Useful for resetting to baseline state.
 */
export function clearSessionState(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("[sessionStorage] Failed to clear session state:", error);
  }
}
