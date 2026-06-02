# Aethel MVP Plan

Status: Draft
Created: June 2, 2026

## Purpose

The MVP is a usable browser-based Aethel interface: a three-column web
app where the user can inspect a 3D agent in an environment, chat with
that agent, and apply controlled changes to the agent and world.

The MVP is not the full NVIDIA Omniverse runtime. It is the first
product slice that proves the interaction model, state model, and UI
boundaries. It should be designed so the center renderer can start as a
browser WebGL scene and later be replaced or augmented by an Omniverse
Kit/RTX stream without rewriting the chat or control panels.

## MVP User Experience

### Layout

The first screen is the actual application, not a landing page.

- **Left column: Control panel** - Persistent controls for changing the
  agent and environment.
- **Center column: 3D view** - Main viewport showing the agent as they
  appear in the current environment.
- **Right column: Chat panel** - Conversation with the currently visible
  agent.

Desktop layout should be the primary target for the MVP. The left and
right columns should have stable widths, and the center viewport should
take the remaining space. On narrow screens, the center 3D view remains
the primary surface, while controls and chat collapse into switchable
panels or drawers.

### Center 3D View

The center column renders the current Aethel scene. For the MVP, this
can be a browser-native 3D scene using a simple environment, a visible
agent avatar, orbit/pan/zoom camera controls, and clear lighting.

The 3D view must:

- Render a nonblank environment and one visible agent on initial load.
- Reflect agent changes made from the control panel, such as name label,
  avatar style, color/accent, or idle pose.
- Reflect environment changes made from the control panel, such as room
  preset, lighting, time of day, weather/ambience preset, or selected
  objects.
- Keep the agent framed by default and provide camera controls that do
  not break the layout.
- Expose a renderer boundary so a later Omniverse/Kit streaming renderer
  can consume the same scene state.

### Right Chat Panel

The right column is only for chatting with the agent. It should not be
the primary surface for direct editing.

The chat panel must:

- Show a message history for the current session.
- Let the user send text messages to the visible agent.
- Show pending, success, and error states for agent responses.
- Include enough current scene and agent state in requests for the agent
  to respond in context.
- Add system/context messages when control-panel changes are applied, so
  the conversation history reflects major user-visible changes.

For the MVP, the agent backend can be implemented as a mock adapter or a
real model adapter, but the UI contract must not depend on which adapter
is active.

### Left Control Panel

The left column is where the user changes the agent and environment. It
should feel like an operator console, not a chat interface.

The control panel must include:

- **Agent controls**: agent name, persona preset, avatar style or color,
  conversational tone, and at least two behavior parameters such as
  curiosity, formality, or skepticism.
- **Environment controls**: environment preset, lighting/time of day,
  ambience/weather preset, and a small object list or object toggles.
- **Apply/reset flow**: changes can be applied to the current scene, and
  the scene can be reset to the MVP baseline.
- **Mutation feedback**: each applied change has a visible status and is
  recorded in the shared session state.

The MVP should prefer explicit controls over natural-language mutation
commands. Chat-driven world editing can be added later once validation
and confirmation rules are defined.

## State Model

The frontend owns a normalized session state for the MVP. That state
should be serializable and should avoid renderer-specific fields.

Minimum session state:

- `sessionId`
- `agent`
  - `id`
  - `displayName`
  - `personaPreset`
  - `tone`
  - `behavior`
  - `appearance`
- `environment`
  - `preset`
  - `timeOfDay`
  - `lighting`
  - `ambience`
  - `objects`
- `chat`
  - ordered message list
  - pending/error metadata
- `mutations`
  - ordered applied mutation list
  - status and timestamp

The renderer reads this state and emits only view events, such as camera
changes or object selection. Control-panel changes produce mutation
events that update session state, then the 3D view and chat context react
to the updated state.

## API Boundary

The MVP can begin with an in-browser mock backend, but the code should
preserve these service boundaries:

- `POST /api/chat` - Send a user message plus current agent/environment
  context and return the agent response.
- `POST /api/mutations` - Validate and apply control-panel mutations.
- `GET /api/session/:id` - Load the current session state.
- `PUT /api/session/:id` - Persist session state.
- `GET /api/health` - Report service health for the web app and active
  agent adapter.

If a WebSocket is added during the MVP, use it for streaming chat tokens,
mutation progress, and scene events. The REST shape above remains the
fallback contract.

## Out of Scope for MVP

- Full Omniverse Kit application embedding.
- Production-grade RTX path-traced streaming.
- Real-time voice input or TTS.
- Multi-agent scenes.
- Persistent multi-user collaboration.
- Full USD transaction editing.
- Autonomous chat-driven environment mutation without explicit user
  confirmation.
- Fine-tuning, LoRA management, or live model hot-swapping.

## Implementation Notes

- The primary MVP language is TypeScript. See
  [../docs/language-and-tooling.md](../docs/language-and-tooling.md) for
  the language and tooling decision.
- Confirmed senior implementation decisions: Bun package manager, React
  Three Fiber renderer, plain CSS with CSS variables, React
  `useReducer` plus context for state management, mock-only in-browser
  adapters for the MVP backend, procedural primitive assets first, `dev`
  as the default branch, and MIT licensing.
- The first implementation should favor a small, coherent web stack over
  an early Omniverse integration. React Three Fiber can prove the UX
  while keeping the renderer swappable.
- The app should use a single source of truth for session state so the
  left controls, center renderer, and right chat cannot drift.
- The center view should be visually legible on first load. A blank
  canvas, hidden avatar, or camera framed away from the agent fails the
  MVP.
- The control column should use standard UI controls: selects for
  presets, sliders for behavior parameters, toggles for environment
  features, and buttons for apply/reset.
- Chat should remain responsive even when the 3D renderer is busy. The
  chat adapter should have timeout and error handling from the start.

## Detailed Implementation Plan

### Target Stack

Use this stack for the MVP unless a task explicitly records a different
decision:

- **Package manager / script runner**: Bun.
- **Language**: TypeScript.
- **UI**: React.
- **Build/dev server**: Vite.
- **3D renderer**: React Three Fiber.
- **Styling**: plain CSS with CSS variables.
- **State management**: React `useReducer` plus context.
- **Unit/component tests**: Vitest plus React Testing Library.
- **Browser/e2e tests**: Playwright.
- **MVP backend strategy**: mock-only in-browser adapters.
- **Future backend**: Python + FastAPI, added only by a later task when
  mock adapters are no longer enough.
- **First asset strategy**: procedural primitive agent/environment
  assets. GLTF/external asset pipelines are out of scope for the first
  renderer task.

### Initial Web App Layout

The first app shell should be implemented under `web/`:

```text
web/
  package.json
  index.html
  src/
    main.tsx
    App.tsx
    app/
      AppShell.tsx
      app-shell.css
    state/
      sessionTypes.ts
      baselineSession.ts
      SessionProvider.tsx
      sessionReducer.ts
      sessionSelectors.ts
      mutationLog.ts
    services/
      chatAdapter.ts
      mockChatAdapter.ts
      mutationAdapter.ts
      sessionStorage.ts
    components/
      controls/
      chat/
      viewport/
      status/
    test/
      renderWithSession.tsx
  tests/
    e2e/
```

This layout is intentionally not final architecture. It is the smallest
structure that separates state, service adapters, UI columns, and the 3D
viewport.

### UI Regions

`AppShell` owns the three-column layout:

- `ControlPanel` renders the left column and dispatches draft/apply/reset
  actions.
- `ViewportPanel` renders the center work surface and hosts the renderer
  boundary.
- `ChatPanel` renders the right column and talks to the chat adapter.

The desktop grid should use stable side columns and a flexible center:

```text
left: 280-340px
center: minmax(480px, 1fr)
right: 320-380px
```

On narrow screens, the center viewport remains visible and controls/chat
move into tabbed panels or drawers. The implementation should avoid
modal-only controls for the MVP because repeated adjustment is a core
workflow.

Styling should use plain CSS and CSS variables. Keep shared color,
spacing, and sizing tokens near the app shell or global styles rather
than introducing Tailwind, CSS-in-JS, or a component library.

### Session State Contract

The session state should be serializable JSON. A representative shape:

```typescript
type SessionState = {
  sessionId: string;
  agent: AgentState;
  environment: EnvironmentState;
  chat: ChatState;
  mutations: MutationRecord[];
  ui: UiState;
};
```

The MVP store should use React `useReducer` plus context. That keeps
state transitions explicit and testable without adding a global state
library before the app needs one.

`ui` may contain selected panel, active control tab, pending request IDs,
and selected object ID. It must not contain DOM nodes, Three.js objects,
renderer handles, or provider-specific model clients.

`AgentState` should include:

- `id`
- `displayName`
- `personaPreset`
- `tone`
- `behavior.curiosity`
- `behavior.formality`
- `behavior.skepticism`
- `appearance.avatarPreset`
- `appearance.accentColor`
- `appearance.idlePose`

`EnvironmentState` should include:

- `preset`
- `timeOfDay`
- `lighting`
- `ambience`
- `weather`
- `objects[]` with stable IDs, labels, type, enabled state, and transform
  hints if the renderer needs them.

`MutationRecord` should include:

- `id`
- `timestamp`
- `source` such as `control-panel`, `chat-confirmed`, or `system`
- `target` such as `agent`, `environment`, or `session`
- `summary`
- `status`
- `patch` or typed payload for the applied change

### Control Panel Behavior

Use local draft state for editable controls. The shared session changes
only when the user applies a control group.

Required control groups:

1. **Agent identity** - display name and persona preset.
2. **Agent behavior** - curiosity, formality, and skepticism sliders.
3. **Agent appearance** - avatar preset, accent color, and idle pose.
4. **Environment** - room/world preset, time of day, lighting, ambience,
   and weather preset.
5. **Objects** - a short list of scene objects with enabled toggles.

Each applied change should:

- validate the draft payload;
- dispatch one state update;
- append one `MutationRecord`;
- append one concise chat system/context message;
- produce visible mutation status in the control panel.

Reset should restore the baseline agent and environment and append a
reset mutation. It should not silently erase the chat transcript.

### 3D Renderer Boundary

The renderer should be exposed through a component like:

```typescript
type AethelViewportProps = {
  agent: AgentState;
  environment: EnvironmentState;
  selectedObjectId?: string;
  onViewEvent(event: ViewEvent): void;
};
```

The MVP renderer should render:

- a simple room or outdoor preset;
- floor/walls or terrain;
- at least three optional scene objects;
- one visible agent avatar with a name label;
- lighting that changes with `timeOfDay` and `lighting`;
- ambience/weather visual hints where practical;
- default camera framing on the agent.

The first agent and environment should be procedural primitive geometry:
simple shapes, materials, labels, and lighting. Do not block MVP
progress on GLTF character models, external art packs, or asset-pipeline
decisions.

The renderer should emit view events for selected objects and camera
changes, but it should not mutate session state directly.

### Chat Adapter

The UI should call a stable chat adapter interface:

```typescript
type ChatRequest = {
  sessionId: string;
  message: string;
  agent: AgentState;
  environment: EnvironmentState;
  recentMessages: ChatMessage[];
};

type ChatAdapter = {
  send(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>;
};
```

The first adapter can be deterministic and local. It should echo enough
context to prove that agent/environment state is included. For example,
if the user changes the agent name or environment preset, the next mock
response should reference the new state.

The interface should leave room for a later `POST /api/chat` backend.

### API and Persistence Path

The MVP should begin with local service adapters:

- `mockChatAdapter` for chat responses.
- `mutationAdapter` for validating and applying control mutations.
- `sessionStorage` for optional local persistence.

Do not add a Python/FastAPI backend for the MVP. The API shape below is
the compatibility path for a future backend, not a requirement for the
first implementation.

When a backend is added, preserve these contracts:

- `POST /api/chat`
- `POST /api/mutations`
- `GET /api/session/:id`
- `PUT /api/session/:id`
- `GET /api/health`

No MVP UI component should import provider-specific NVIDIA, OpenAI, or
Omniverse clients directly.

### Testing Strategy

Unit tests:

- reducer/action behavior for every mutation type;
- selectors that build chat context from session state;
- adapter request/response behavior;
- validation for control-panel drafts.

Component tests:

- app shell renders all three regions;
- controls apply changes and show mutation status;
- chat sends messages, shows pending state, handles errors, and preserves
  message history;
- viewport receives updated props when session state changes.

Browser/e2e tests:

- desktop three-column layout exists;
- narrow layout does not overlap panels;
- initial 3D viewport is nonblank and the agent is visible;
- applying one agent appearance change, one behavior/persona change, and
  one environment change updates state and visible UI;
- sending chat includes current state and displays an agent response;
- reset restores the baseline scene while preserving history.

For the 3D nonblank check, assert more than the presence of a canvas.
Use a canvas pixel sample, screenshot comparison, or renderer-provided
ready signal plus visual content assertions.

### Implementation Sequence

1. Create the Bun-managed Vite + React + TypeScript web app and wire
   root Makefile targets to the real web commands.
2. Implement the three-column shell and responsive panel behavior.
3. Define the session state types, baseline state, reducer/actions,
   selectors, and local persistence.
4. Implement the renderer boundary and MVP 3D scene.
5. Implement the left control panel with draft/apply/reset flows.
6. Implement the right chat panel and mock chat adapter.
7. Add Playwright verification for layout, state synchronization, chat,
   and nonblank 3D rendering.
8. Update README/docs with actual install, run, build, test, and lint
   commands once they exist.

### Delivery Gates

The MVP is ready to call complete only when:

- Bun install instructions are documented;
- `make fmt-check`, `make build`, `make test`, and `make lint` run real
  commands instead of placeholders;
- the app opens to the three-column UI;
- the center viewport renders a visible agent and environment;
- controls mutate shared state and visible scene output;
- chat uses the current session context;
- the e2e suite verifies the full MVP flow.

### Branch and License Decisions

- Use `dev` as the default branch.
- Do MVP implementation work on feature branches off `dev`.
- License the project under MIT.

### Risks and Mitigations

- **3D viewport flakes in tests**: use deterministic scene setup and a
  renderer-ready signal before screenshot/pixel checks.
- **State drift between panels**: keep one reducer/store and pass derived
  props down; avoid panel-local copies except temporary drafts.
- **Renderer coupling**: keep renderer-specific objects inside the
  viewport implementation and expose only typed state and view events.
- **Mock backend hides integration problems**: define adapter contracts
  early and test request payload shape, not only rendered text.
- **Scope creep into full Omniverse integration**: keep Omniverse work
  out of MVP tasks unless a later plan explicitly changes the baseline.

## Acceptance Criteria

- [ ] CRIT-1: The web app opens to a three-column application layout:
      left controls, center 3D viewport, and right chat. On a desktop
      viewport, all three regions are visible at once and the 3D viewport
      occupies the center as the dominant surface.
- [ ] CRIT-2: The center viewport renders a nonblank 3D environment with
      one visible, framed agent on initial load. This is verified with a
      browser screenshot or automated visual check.
- [ ] CRIT-3: At least three control-panel changes update shared session
      state and visibly affect the 3D view: one agent appearance change,
      one agent behavior/persona change, and one environment change.
- [ ] CRIT-4: The right chat panel sends user messages and receives
      agent responses through a chat adapter. The request includes the
      current agent and environment context, and the UI shows pending and
      error states.
- [ ] CRIT-5: Applying a control-panel mutation records the mutation in
      session state and adds a concise system/context entry to the chat
      history.
- [ ] CRIT-6: The renderer is isolated behind a component/service
      boundary that accepts normalized session state, so a future
      Omniverse/Kit renderer can replace the MVP browser renderer.
- [ ] CRIT-7: The MVP implementation has tests or scripted verification
      covering layout presence, state updates from controls, chat
      adapter behavior, and nonblank 3D rendering.
