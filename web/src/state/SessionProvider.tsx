import { createContext, useContext, useReducer, ReactNode } from "react";
import { SessionState } from "./sessionTypes";
import { baselineSession } from "./baselineSession";
import { reducer } from "./sessionReducer";
import { selectChatContext, selectRendererProps } from "./sessionSelectors";

// Create React context for the session state and dispatch
export const SessionContext = createContext<{
  state: SessionState;
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
 * Selectors are provided for components to derive derived data such as
 * chat context and renderer props without mutating state.
 */
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize the reducer with the baseline session
  const [state, dispatch] = useReducer(reducer, baselineSession);

  // Optional effect to sync external resources (e.g., localStorage) on state changes
  // Could be used for session persistence but kept minimal for MVP
  // useEffect(() => {
  //   const stored = localStorage.getItem('session');
  //   if (stored) {
  //     dispatch({ type: 'misc/rehydrate' });
  //   }
  // }, [state]);

  // Provide the context value
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

// Hook to read dispatch (typed)
export const useSessionDispatch = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionDispatch must be used within a SessionProvider");
  }
  // The dispatch function is untyped loosely; casting is performed elsewhere
  return context.dispatch;
};
