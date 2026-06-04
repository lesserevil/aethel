// Extends the React.JSX namespace with React Three Fiber's three.js element types.
// This lets TypeScript recognise <mesh>, <group>, <ambientLight>, etc.
// in R3F component files when using react-jsx transform (React 18+).
//
// R3F v8 augments the global JSX.IntrinsicElements but TypeScript 5 + react-jsx
// uses React.JSX.IntrinsicElements. This file bridges the gap.
import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
