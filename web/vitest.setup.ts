// Minimal setup for jsdom
import "@testing-library/jest-dom";

// React 18 JSX runtime setup for Bun
import React from "react";
globalThis.React = React;
