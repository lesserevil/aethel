import "./index.css";
import { AppShell } from "./app/AppShell";
import { SessionProvider } from "./state/SessionProvider";

export function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}
