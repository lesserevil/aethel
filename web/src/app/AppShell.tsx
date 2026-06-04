import "./app-shell.css";
import { ControlPanel } from "../components/controls/ControlPanel";
import { AethelViewport } from "../components/viewport";
import { baselineSession } from "../state/baselineSession";

export function AppShell() {
  return (
    <div className="app-shell" role="region" aria-label="Aethel application shell">
      <aside
        className="app-shell__control-panel"
        id="control-panel"
        data-testid="control-panel-container"
      >
        <ControlPanel />
      </aside>

      <main
        className="app-shell__viewport-panel"
        id="viewport-panel"
        role="region"
        aria-label="3D viewport"
        data-testid="viewport-panel"
      >
        <AethelViewport
          agent={baselineSession.agent}
          environment={baselineSession.environment}
          selectedObjectId={baselineSession.ui.selectedObjectId}
        />
      </main>

      <aside
        className="app-shell__chat-panel"
        id="chat-panel"
        role="region"
        aria-label="Chat panel"
        data-testid="chat-panel"
      >
        Chat Panel Placeholder
      </aside>
    </div>
  );
}
