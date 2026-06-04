// Minimal setup for jsdom
import "@testing-library/jest-dom";

// React 18 JSX runtime setup for Bun
import React from "react";
globalThis.React = React;

// jsdom does not implement scrollIntoView; polyfill it as a no-op so that
// ChatPanel's auto-scroll useEffect does not throw in tests.
// We access HTMLElement through globalThis so this file compiles under the
// node tsconfig (which does not include DOM lib types).
const g = globalThis as Record<string, unknown>;
if (g["HTMLElement"] && typeof g["HTMLElement"] === "function") {
  (g["HTMLElement"] as { prototype: Record<string, unknown> }).prototype[
    "scrollIntoView"
  ] = function () {};
}
