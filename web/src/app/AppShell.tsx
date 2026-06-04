import { useCallback } from "react";
import { AgentControlPanel } from "./ControlPanel";
import { ControlPanel as EnvironmentControlPanel } from "../components/controls/ControlPanel";
import { AethelViewport } from "../components/viewport";
import { ChatPanel } from "./ChatPanel";
import { useRendererProps, useSessionDispatch } from "../state/SessionProvider";
import { setSelectedObject } from "../state/sessionActions";
import type { ViewEvent } from "../components/viewport/types";
import "./app-shell.css";

export function AppShell() {
  // Read live renderer props from session state (agent, environment, selectedObjectId)
  const rendererProps = useRendererProps();
  const dispatch = useSessionDispatch();

  // Forward viewport view events to session state through the dispatch boundary.
  // The renderer must NOT mutate state directly — only emit events here.
  const handleViewEvent = useCallback(
    (event: ViewEvent) => {
      if (event.type === "object-click" && event.objectId !== undefined) {
        // Object selected in viewport → update shared selectedObjectId
        dispatch(setSelectedObject(event.objectId));
      } else if (event.type === "background-click") {
        // Click on empty background → deselect
        dispatch(setSelectedObject(undefined));
      }
      // camera-change, object-hover, object-blur are informational only for now
    },
    [dispatch],
  );

  return (
    <div className="app-shell" role="region" aria-label="Aethel application shell">
      <aside
        className="app-shell__control-panel"
        id="control-panel"
        data-testid="control-panel-container"
      >
        <AgentControlPanel />
        <EnvironmentControlPanel />
      </aside>

      <main
        className="app-shell__viewport-panel"
        id="viewport-panel"
        role="region"
        aria-label="3D viewport"
        data-testid="viewport-panel"
      >
        <AethelViewport
          agent={rendererProps.agent}
          environment={rendererProps.environment}
          selectedObjectId={rendererProps.selectedObjectId}
          onViewEvent={handleViewEvent}
        />
      </main>

      <aside
        className="app-shell__chat-panel"
        id="chat-panel"
        role="region"
        aria-label="Chat panel"
        data-testid="chat-panel"
      >
        <ChatPanel />
      </aside>
    </div>
  );
}
