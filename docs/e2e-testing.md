# E2E Testing Guide

Aethel uses [Playwright](https://playwright.dev/) for end-to-end browser tests.
The tests live in `web/tests/e2e/` and are the acceptance gate for the MVP user
experience.

## Prerequisites

1. **Bun** — install from <https://bun.sh>
2. **Web dependencies** — run once per clone:

   ```bash
   make init
   # or: cd web && bun install
   ```

3. **Browser binary** — Playwright needs a Chromium-compatible browser.

   - On supported systems, install Playwright's bundled Chromium:

     ```bash
     cd web && bunx playwright install chromium --with-deps
     ```

   - On unsupported OS versions, the config auto-detects a system Chrome at
     `/usr/bin/google-chrome` or `/usr/bin/chromium-browser`.

   - Override the browser path with the environment variable:

     ```bash
     PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome make test-e2e
     ```

## Running the tests

From the repo root:

```bash
make test-e2e
```

Or directly from `web/`:

```bash
cd web && bun run test:e2e
```

The tests start the Vite dev server automatically via `webServer` config and
shut it down on completion. An existing dev server on port 5173 is reused when
not running in CI.

### Interactive / debug mode

```bash
cd web && bun run test:e2e:ui
```

### Single file

```bash
cd web && bunx playwright test tests/e2e/layout.spec.ts
```

## Test files

| File | What is verified |
|------|-----------------|
| `layout.spec.ts` | Desktop 3-column layout and narrow-screen no-overlap |
| `viewport.spec.ts` | 3D canvas presence, renderer-ready signal, nonblank pixel check, agent name label |
| `controls.spec.ts` | Agent identity/appearance/persona mutations, environment preset, reset flow |
| `chat.spec.ts` | Message send/receive, context-aware responses, Enter/Shift+Enter keyboard handling |
| `office-assets.spec.ts` | Office GLB HTTP 200 responses, no external asset hosts, all ten objects enabled |

## Acceptance criteria verified

| Criterion | Tests |
|-----------|-------|
| Desktop 3-column layout | `layout.spec.ts` — Desktop three-column layout |
| Narrow layout no overlap | `layout.spec.ts` — Narrow screen layout |
| Viewport is nonblank | `viewport.spec.ts` — canvas pixel sample |
| Viewport renderer-ready signal | `viewport.spec.ts` — data-viewport-ready attribute |
| Agent mutation → chat system message | `controls.spec.ts` — display name, avatar preset |
| Environment mutation → chat system message | `controls.spec.ts` — environment preset |
| Reset preserves history | `controls.spec.ts` — Reset Scene button |
| Chat response uses agent context | `chat.spec.ts` — displayName in response |
| Chat response uses environment context | `chat.spec.ts` — preset in response |
| Context updates after mutation | `chat.spec.ts` — after rename / after env change |
| Office GLBs return HTTP 200 | `office-assets.spec.ts` — all /assets/office/*.glb requests |
| No external asset requests | `office-assets.spec.ts` — external-host check |
| Office preset active by default | `office-assets.spec.ts` — data-environment-preset attribute |
| All ten office objects enabled | `office-assets.spec.ts` — data-enabled-objects attribute |

## Notes on design

- **No flaky sleeps**: tests wait for explicit readiness signals
  (`data-viewport-ready="true"`, visible DOM elements) rather than fixed delays.
- **Deterministic mock adapter**: the in-browser `mockChatAdapter` returns
  `"Response from <displayName> (<personaPreset>) Environment: <preset> ..."` so
  context checks are precise string assertions.
- **Canvas pixel sample**: `viewport.spec.ts` uses Playwright's screenshot API
  to capture the rendered viewport, then decodes the PNG in the browser to count
  non-background pixels. This fails correctly when the canvas is blank.
- **data-testid on Three.js objects**: R3F/Three.js primitives (`<mesh>`,
  `<group>`, `<ambientLight>`) do not support `data-*` HTML attributes in real
  browsers — the props would be interpreted as nested dot-path assignments on
  Three.js objects, causing crashes. The `AethelViewport` wrapper div and the
  agent name label `<Html>` overlay are the proper targets for test queries.
