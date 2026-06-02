/**
 * App – minimal root component for the Aethel MVP.
 *
 * The three-column shell (ControlPanel | Viewport | ChatPanel) is
 * implemented in a follow-up task (TASK-3.2). This placeholder keeps
 * the build green and the entrypoint wired so later tasks can import
 * and render the real shell.
 */
export function App() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        flexDirection: "column",
        gap: "var(--spacing-4)",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--color-accent)",
          letterSpacing: "-0.02em",
        }}
      >
        Aethel
      </h1>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Three-column shell coming soon.
      </p>
    </div>
  );
}
