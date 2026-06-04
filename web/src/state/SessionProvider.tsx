import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { SessionState } from "./sessionTypes";
import { baselineSession } from "./baselineSession";
import { reducer } from "./sessionReducer";
import { SessionAction } from "./sessionActions";
import {
  selectChatContext,
  selectRendererProps,
  ChatContext,
  RendererProps,
} from "./sessionSelectors";

// ── Context types ─────────────────────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
}

// ── Context creation ──────────────────────────────────────────────────────────

export const SessionContext = createContext<SessionContextValue>({
  state: baselineSession,
  dispatch: () => undefined,
});

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * SessionProvider wraps the app and makes session state + typed dispatch
 * available to all descendants via React context.
 *
 * The reducer is a pure function defined in ./sessionReducer.ts.
 * Selectors are exposed via the hooks below.
 */
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, baselineSession);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Read the full session state. Throws if used outside SessionProvider. */
export const useSessionState = (): SessionState => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionState must be used within a SessionProvider");
  }
  return context.state;
};

/** Typed dispatch hook. Throws if used outside SessionProvider. */
export const useSessionDispatch = (): Dispatch<SessionAction> => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionDispatch must be used within a SessionProvider");
  }
  return context.dispatch;
};

/** Derived chat context – stable slice of chat state for the chat panel. */
export const useChatContext = (): ChatContext => {
  const state = useSessionState();
  return selectChatContext(state);
};

/** Derived renderer props – normalized props for the 3D viewport. */
export const useRendererProps = (): RendererProps => {
  const state = useSessionState();
  return selectRendererProps(state);
};
