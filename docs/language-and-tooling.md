# Language and Tooling

This page documents the implementation language decision for Aethel.

## Decision

Use **TypeScript as the primary MVP language**.

The MVP is a browser application with a left control panel, center 3D
viewport, and right chat panel. TypeScript gives the frontend a typed
state model, typed component props, typed chat and mutation adapters, and
a natural path into browser-native 3D libraries.

Use **Python for backend services and NVIDIA integration** once the MVP
needs a real service layer.

Use **C++ only later**, when a specific performance-critical Omniverse
Kit extension, renderer integration, or native simulation component
requires it.

## MVP Stack

The first implementation should use:

- **Bun** as the package manager, script runner, and frontend dependency
  installer.
- **TypeScript** for application code, session state, adapters, and
  tests.
- **React** for the web UI.
- **Vite** for the frontend build and development server.
- **React Three Fiber** for the center browser-native 3D viewport.
- **Plain CSS with CSS variables** for styling. Do not introduce
  Tailwind or a component library for the MVP.
- **React `useReducer` plus context** for MVP state management.
- **Vitest** for unit and component tests.
- **Playwright** for browser integration tests and nonblank 3D viewport
  checks.
- **Procedural primitive 3D assets** for the first agent and
  environment. GLTF or external asset pipelines can come later.

The renderer must sit behind a boundary that accepts normalized session
state. That keeps the MVP renderer replaceable by a later Omniverse Kit
or RTX streaming renderer.

## Backend Path

The MVP may start with in-browser mock adapters. When real services are
needed, add a Python backend. Do not add the Python backend during the
MVP unless a later task explicitly changes this decision.

- **Python** for agent adapters, service orchestration, and NVIDIA SDK /
  NIM / NeMo integration.
- **FastAPI** for REST endpoints such as `/api/chat`, `/api/mutations`,
  `/api/session/:id`, and `/api/health`.
- **WebSockets** for streaming chat tokens, mutation progress, and scene
  events if the MVP needs streaming behavior.

The Python backend should preserve the frontend contracts from the MVP
plan rather than leaking provider-specific model details into UI code.

## Future Native Work

Omniverse Kit supports Python and C++ extension work. For Aethel, Python
should be the first choice for future Kit scripting and integration
work. C++ is reserved for cases where Python is not enough, such as
performance-sensitive native plugins, custom renderer hooks, or physics
components that require native APIs.

## Branch Workflow

Use `dev` as the default branch. Implementation work should happen on
feature branches off `dev`, then merge back into `dev` after review and
quality gates.

## License

Aethel is licensed under the MIT License. See
[`../LICENSE`](../LICENSE).

## Non-Goals

- Do not start the MVP as a C++ application.
- Do not require Omniverse Kit or RTX streaming to run the first web
  prototype.
- Do not add a Python/FastAPI backend to the MVP unless a later task
  explicitly changes the backend decision.
- Do not hard-code a single model provider in the TypeScript UI.
- Do not store renderer-specific objects in shared session state.

## References

- TypeScript documentation: https://www.typescriptlang.org/docs/
- React TypeScript guide: https://react.dev/learn/typescript
- Vite guide: https://vite.dev/guide/
- React Three Fiber introduction:
  https://r3f.docs.pmnd.rs/getting-started/introduction
- NVIDIA Omniverse developer documentation:
  https://docs.omniverse.nvidia.com/dev-guide/latest/developer_api.html
- NVIDIA NeMo Framework documentation:
  https://docs.nvidia.com/nemo-framework/index.html
