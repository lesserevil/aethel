import "./app-shell.css";

export function AppShell() {
  return (
    <div className="app-shell" role="region" aria-label="Aethel application shell">
      <aside
        className="app-shell__control-panel"
        id="control-panel"
        role="region"
        aria-label="Control panel"
        data-testid="control-panel"
      >
        Control Panel Placeholder
      </aside>

      <main
        className="app-shell__viewport-panel"
        id="viewport-panel"
        role="region"
        aria-label="3D viewport"
        data-testid="viewport-panel"
      >
        Viewport Panel Placeholder
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
