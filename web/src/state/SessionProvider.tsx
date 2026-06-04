import { createContext, useContext, useReducer, ReactNode } from "react";
import { SessionState, baselineSession } from "./baselineSession";
import { reducer } from "./sessionReducer";
import { selectChatContext, selectRendererProps } from "./sessionSelectors";

// Create React context for the session state and dispatch
export const SessionContext = createContext<{
  state: SessionState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: (action: any) => void;
}>({
  state: baselineSession,
  dispatch: () => undefined,
});

/**
 * SessionProvider wraps the app and provides the session state and dispatch
 * functions to all descendants via React context.
 *
 * The reducer is a pure function defined in ./sessionReducer.ts that
 * handles all action types and returns a new immutable state.
 *
 * Selectors are provided for components to derive data such as
 * chat context and renderer props without mutating state.
 */
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the reducer with the baseline session
  const [state, dispatch] = useReducer(reducer, baselineSession);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
};

// Hook to read session state (typed)
export const useSessionState = (): SessionState => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionState must be used within a SessionProvider");
  }
  return context.state;
};

// Hook to read derived data
export const useChatContext = () => {
  const state = useSessionState();
  return selectChatContext(state);
};

export const useRendererProps = () => {
  const state = useSessionState();
  return selectRendererProps(state);
};

// Hook to dispatch actions
export const useSessionDispatch = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionDispatch must be used within a SessionProvider");
  }
  return context.dispatch;
};
