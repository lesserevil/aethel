// Global type augmentation: extend React 19's JSX.IntrinsicElements with
// React Three Fiber's Three.js element types.
//
// R3F 8.x declares its JSX types in the legacy global `JSX` namespace
// (via `declare global { namespace JSX { ... } }`), which is not picked up by
// @types/react 19.x because React 19 moved JSX types into `React.JSX`.
//
// This file bridges the gap by explicitly extending `React.JSX.IntrinsicElements`
// with R3F's `ThreeElements` so TypeScript recognises Three.js JSX primitives
// (mesh, group, ambientLight, meshStandardMaterial, etc.) in source files.

import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
