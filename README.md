# Aethel

Aethel is a planned virtual-world interface for interacting with AI
agents in mutable 3D environments. The long-term design targets a
NVIDIA-powered simulation stack, while the MVP focuses on proving the
browser interaction model first.

## Current Status

The MVP web application is implemented and the quality gates pass. Run
`bun install` in the `web/` directory, then use the Makefile targets
below to build, test, and run the app.

Current project sources of truth:

- [plans/aethel_mvp_plan.md](plans/aethel_mvp_plan.md) - MVP product
  and implementation plan.
- [plans/aethel_design.md](plans/aethel_design.md) - broader
  NVIDIA-oriented Aethel design and technology direction.
- [docs/language-and-tooling.md](docs/language-and-tooling.md) -
  implementation language and tooling decision.
- [docs/nemotron-chat.md](docs/nemotron-chat.md) - Nemotron chat
  backend: credential setup, environment variables, API reference, and
  how to run the backend alongside the web app.
- [docs/office-physics.md](docs/office-physics.md) - optional Newton
  evaluation harness: install steps, usage, tested CPU/GPU behavior,
  why Newton is not a default MVP dependency, and where GPU-backed
  simulation is now required for future high-fidelity work.
- `backlog/` - Backlog.md task files for planned and completed work.

## MVP

> **GPU requirement boundary.** `make run` still starts the current
> browser-based MVP on any machine with Bun and Node. No Newton, PhysX,
> Omniverse Kit, Isaac Sim, CUDA, or server-side GPU is needed to view
> the static MVP. Future high-fidelity runtime simulation work now
> requires a server/simulation-host NVIDIA GPU; see
> [docs/office-physics.md](docs/office-physics.md) and
> [plans/gpu-runtime-simulation-plan.md](plans/gpu-runtime-simulation-plan.md).

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
- In-browser mock adapters as the default chat backend (no credentials
  required); optional Python/FastAPI backend for live NVIDIA model chat.
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

## Nemotron Chat

The chat panel ships with two operating modes:

| Mode | What runs | Requires |
|------|-----------|----------|
| **Mock** (default) | In-browser deterministic stub adapter | Nothing — works offline |
| **Nemotron** | Python/FastAPI backend → NVIDIA Nemotron model | NVIDIA API key + `make run-api` |

### Mock mode — zero configuration

```bash
make run          # browser app on port 5173; chat uses the in-browser stub
```

No API key, no backend, no credentials needed.

### Nemotron mode — live model responses

Credentials are kept server-side. The browser never sees the NVIDIA key.

**Step 1 — configure credentials** (pick one):

```bash
# Option A: environment variable
export NVIDIA_API_KEY=sk-...

# Option B: ~/.netrc entry
# machine inference-api.nvidia.com
#   login user
#   password sk-...
```

**Step 2 — start the backend** (in one terminal):

```bash
pip install -r api/requirements.txt   # first time only
export AETHEL_CHAT_PROVIDER=nvidia
make run-api                           # FastAPI on port 8000
```

**Step 3 — point the browser at the backend** (create `web/.env.local`):

```
VITE_CHAT_PROVIDER=api
```

**Step 4 — start the web app** (in another terminal):

```bash
make run          # Vite dev server on port 5173
```

Open `http://localhost:5173` and chat.  Responses come from the
Nemotron model via the backend. During local development, Vite proxies
browser requests from `/api/*` on port 5173 to the FastAPI backend on
`http://127.0.0.1:8000`.

For full API reference, troubleshooting, and advanced environment
variables see [docs/nemotron-chat.md](docs/nemotron-chat.md).

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

The project toolchain is configured with Bun as the package manager and
script runner. The Makefile quality-gate targets delegate to the web/
workspace Bun scripts:

- `make init` - Installs dependencies and initializes local project tooling
- `make run` - Starts the MVP web app development server on all interfaces
- `make run-api` - Starts the backend chat API server on port 8000 (requires `pip install -r api/requirements.txt`)
- `make fmt` - Runs `bun run fmt` in the web/ directory
- `make fmt-check` - Runs `bun run fmt-check` in the web/ directory
- `make build` - Runs `bun run build` in the web/ directory
- `make test` - Runs `bun run test` in the web/ directory (no NVIDIA key required)
- `make test-api` - Runs backend chat service unit tests (no NVIDIA key required)
- `make test-e2e` - Runs `bun run test:e2e` in the web/ directory
- `make lint` - Runs `bun run typecheck && bun run lint` in the web/ directory
- `make clean` - Removes build artifacts from the web/ directory

**Optional: USD asset validation** (requires Python 3, no GPU):

- `make assets-validate` - Validates USD Physics metadata for office prop USDA files
- `make assets-validate-test` - Runs unit tests for the USD validator

**Optional: Newton physics evaluation** (Newton and NVIDIA Warp are optional; no GPU required for dry-run):

- `make physics-harness-dry-run` - Runs the Newton smoke harness in dry-run mode (analytic, no Newton or GPU needed)
- `make physics-harness` - Runs the Newton smoke harness with Newton (skips cleanly if Newton is not installed)
- `make physics-harness-test` - Runs unit and integration tests for the Newton harness (no GPU needed)

See [docs/office-physics.md](docs/office-physics.md) for full Newton installation instructions and expected output.

**Future GPU-backed runtime simulation**:

High-fidelity office-world physics and simulation work now assumes a
server/simulation-host NVIDIA GPU. The current MVP and dry-run validation
targets remain available on CPU-only machines, but new realistic-world
simulation implementation should follow
[plans/gpu-runtime-simulation-plan.md](plans/gpu-runtime-simulation-plan.md).

To install dependencies: `make init`

## License

Aethel is licensed under the MIT License. See [LICENSE](LICENSE).
