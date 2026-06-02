# Aethel

Aethel is a planned virtual-world interface for interacting with AI
agents in mutable 3D environments. The long-term design targets a
NVIDIA-powered simulation stack, while the MVP focuses on proving the
browser interaction model first.

## Current Status

This repository is in planning and scaffolding. The web application is
not implemented yet.

Current project sources of truth:

- [plans/aethel_mvp_plan.md](plans/aethel_mvp_plan.md) - MVP product
  and implementation plan.
- [plans/aethel_design.md](plans/aethel_design.md) - broader
  NVIDIA-oriented Aethel design and technology direction.
- [docs/language-and-tooling.md](docs/language-and-tooling.md) -
  implementation language and tooling decision.
- `backlog/` - Backlog.md task files for planned and completed work.

## MVP

The MVP is a browser-based web app with three persistent regions:

- **Left control column** - Agent and environment controls. Users change
  agent name, persona, behavior parameters, avatar appearance,
  environment preset, lighting, ambience, and scene object toggles here.
- **Center 3D view** - The main work surface. It shows the visible agent
  in the current environment and reacts to applied control changes.
- **Right chat column** - Conversation with the currently visible agent.
  Chat receives current agent and environment context but is not the
  primary editing surface for the MVP.

The first implementation will use React Three Fiber behind a renderer
boundary. That keeps the MVP small while preserving a future path to an
Omniverse Kit / RTX renderer or streaming integration.

## Implementation Decisions

The confirmed MVP implementation choices are:

- Bun for package management and script running.
- TypeScript, React, and Vite for the browser app.
- React Three Fiber for the center 3D viewport.
- Plain CSS with CSS variables for styling.
- React `useReducer` plus context for MVP state management.
- Mock-only in-browser adapters for the MVP backend.
- Procedural primitive assets for the first agent and environment.
- `dev` as the default branch, with feature branches off `dev`.
- MIT License.

## Technology Direction

The current design review points the full Aethel direction at supported
NVIDIA release lines and services, including:

- Omniverse Kit SDK 110.x and RTX Renderer 110.x.
- PhysX SDK 5.6.x / Omniverse Physics.
- Isaac Sim 5.1.0 GA for robotics simulation baselines.
- OpenUSD for scene representation.
- NVIDIA NIM, Triton Inference Server, NeMo Framework, NeMo Guardrails,
  Speech NIM / Riva, Audio2Face-3D NIM, Nemotron models, and Cosmos
  world foundation models for AI agent and simulation workflows.

The MVP does not require the full production NVIDIA stack on day one.
See [plans/aethel_design.md](plans/aethel_design.md) for the current
technology review and source links.

## Repository Layout

- `AGENTS.md` - Agent operating rules for this repository.
- `Makefile` - Initialization and quality-gate target names.
- `README.md` - This project overview.
- `backlog/` - Backlog.md task files.
- `backlog.config.yml` - Backlog.md configuration.
- `docs/` - User-facing documentation.
- `plans/` - Design docs, architecture notes, and implementation plans.
- `scripts/githooks/` - Git hook scaffolding.

## Task Tracking

This repo uses Backlog.md for task tracking. The local workflow runs the
Backlog.md CLI through Bun:

```bash
bun x --bun github:lesserevil/Backlog.md task list --plain
```

Current MVP implementation tasks are tracked in Backlog.md:

- `TASK-3` - Scaffold the web app shell and three-column layout.
- `TASK-4` - Implement MVP session state and mutation model.
- `TASK-5` - Implement the center 3D agent/environment renderer.
- `TASK-6` - Implement the left control panel.
- `TASK-7` - Implement the right chat panel and chat adapter.
- `TASK-8` - Add MVP integration and visual verification.

## Development Notes

The project toolchain is not fully configured yet. The Makefile exposes
the expected quality-gate target names, but `fmt`, `fmt-check`, `build`,
`test`, and `lint` are currently placeholders and intentionally fail
until the first implementation stack is added.

Once the web app is scaffolded, update this README with the actual
install, run, build, and test commands, and wire the Makefile targets to
the real project commands.

## License

Aethel is licensed under the MIT License. See [LICENSE](LICENSE).
