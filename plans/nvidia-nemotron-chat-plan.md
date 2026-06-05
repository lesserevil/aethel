# NVIDIA Nemotron Chat Integration Plan

Status: Complete
Created: June 5, 2026
Completed: June 5, 2026

## Purpose

Aethel's chat panel currently uses a deterministic in-browser mock
adapter. The next model integration should connect the chat flow to a
real NVIDIA-hosted Nemotron model while preserving the existing
frontend adapter contract and keeping secrets out of the browser bundle.

The selected first target is NVIDIA Nemotron 3 Nano Omni because it is
the current NVIDIA Nemotron model in the API catalog that supports
text, image, video, and audio understanding. The first Aethel
integration should use it for text chat with scene context, then leave a
typed path for future viewport screenshot/image input.

## Model Decision

Use:

- NVIDIA API catalog route:
  `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`
- Hosted model id verified through `inference-api.nvidia.com`:
  `nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`
- Self-hosted OpenAI-compatible model string from NVIDIA examples:
  `nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4`

Why this model:

- It is a Nemotron-family multimodal model.
- NVIDIA documents video, audio, image, and text inputs.
- NVIDIA documents text output, JSON output support, tool calling, and
  reasoning mode.
- The model is intended for GUI automation, document intelligence,
  media/video understanding, and agentic workflows, which are closer to
  Aethel's future needs than text-only Nemotron variants.

For the first integration, disable reasoning output in normal chat
responses so the user sees concise agent replies instead of raw
reasoning traces. Keep reasoning mode as a future explicit setting, not
the default.

## Credential Status

The requested `~/.netrc` lookup found a machine entry for
`inference-api.nvidia.com`. The first live probe failed with HTTP 401
because the endpoint expected a LiteLLM virtual key starting with `sk-`.
After the credential was replaced, a Bearer-authenticated request to
`https://inference-api.nvidia.com/v1/models` returned HTTP 200 and a
minimal text request to
`https://inference-api.nvidia.com/v1/chat/completions` returned a text
response from
`nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`.

No credential value should be committed, logged, copied into docs, or
sent to the browser. A human or credential-management task must replace
the NVIDIA netrc entry with a valid key if the live smoke check ever
regresses.

## Runtime Architecture

Do not call NVIDIA directly from browser TypeScript. The browser cannot
read `~/.netrc`, and embedding the NVIDIA token in Vite config would
expose it to users.

Add a backend chat boundary:

```text
ChatPanel -> apiChatAdapter -> /api/chat -> NVIDIA chat client
```

The backend should:

- read the NVIDIA API key from `~/.netrc` or an environment variable
  such as `NVIDIA_API_KEY`;
- call `https://inference-api.nvidia.com/v1/chat/completions` or the
  confirmed OpenAI-compatible path for the selected model;
- never return provider credentials to the frontend;
- preserve the existing `ChatRequest` and `ChatResponse` semantics;
- include current agent and environment state in the prompt;
- apply timeouts and cancellation where practical;
- return structured errors that the current chat panel can display.

Use Python and FastAPI for the first backend service unless an
implementation task records a narrower local-dev proxy decision. This
matches `docs/language-and-tooling.md`, which assigns NVIDIA integration
and future agent services to Python.

## Configuration

Default behavior should remain mock-only until the real backend is
configured and explicitly selected. Suggested configuration:

- `AETHEL_CHAT_PROVIDER=mock|nvidia`
- `NVIDIA_API_BASE_URL=https://inference-api.nvidia.com/v1`
- `NVIDIA_MODEL=nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`
- `NVIDIA_API_KEY` as an override for `~/.netrc`

Frontend configuration must not include the NVIDIA API key. It may
include only a provider switch or API base path such as `/api/chat`.

## Prompt Contract

The backend should transform the current `ChatRequest` into a compact
model prompt:

- system message: Aethel agent role, safety constraints, and instruction
  to answer as the visible agent;
- scene context: agent display name, persona preset, tone, behavior
  sliders, environment preset, lighting/time, enabled office objects, and
  selected object if present;
- recent chat history: bounded list of user/agent/system messages;
- user message: the current chat text.

The response must map back to the existing frontend `ChatResponse`:

```typescript
{
  response: string;
  newMessageId: string;
}
```

No model-specific response shape should leak into `ChatPanel`.

## Multimodal Path

The first live integration can be text-only. The adapter should still
leave a typed extension point for future multimodal inputs:

- viewport screenshot or selected object image as `image_url`;
- user-uploaded image in a future chat attachment flow;
- audio/video only after explicit upload, privacy, and size rules exist.

Do not add hidden screenshot uploads in the first task. Any multimodal
payload must be explicit, testable, and documented.

## Local Development

The developer workflow should remain simple:

- `make run` continues to start the browser MVP.
- Add a backend run target such as `make run-api` or update `make run`
  only if the implementation also updates user docs.
- The app should still work with the mock adapter when the backend,
  NVIDIA key, or network is unavailable.
- Live NVIDIA smoke tests should be separate from default unit tests so
  invalid or absent credentials do not break normal quality gates.

## Testing Strategy

Required tests:

- backend unit tests for netrc/env credential loading without printing
  secrets;
- backend client tests with NVIDIA HTTP calls mocked;
- prompt builder tests that prove agent/environment context is included;
- frontend adapter tests with `fetch` mocked;
- chat panel tests proving backend errors display without deleting
  history;
- one opt-in live smoke command that sends a low-token text request to
  the selected model after valid credentials exist.

Default `make test` must not require NVIDIA network access or a real API
key.

## Backlog Implementation Map

- TASK-19: Integrate NVIDIA Nemotron chat model.
- TASK-19.1: Resolve NVIDIA inference API credential and verify Nemotron
  endpoint.
- TASK-19.2: Scaffold backend chat service and secure config loading.
- TASK-19.3: Implement Nemotron client and Aethel prompt builder.
- TASK-19.4: Add frontend API chat adapter and provider selection.
- TASK-19.5: Document Nemotron runtime workflow and dev server wiring.
- TASK-19.6: Add opt-in live Nemotron smoke check and close integration
  plan.

## Sources Reviewed

Reviewed June 5, 2026:

- NVIDIA API reference for Nemotron 3 Nano Omni:
  https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-nano-omni-30b-a3b-reasoning
- NVIDIA multimodal API index:
  https://docs.api.nvidia.com/nim/reference/multimodal-apis
- NVIDIA model catalog:
  https://build.nvidia.com/nvidia

## Acceptance Criteria

- [x] CRIT-1: The selected NVIDIA model and exact request path are
      verified with a valid credential, and the verification command does
      not print or commit the secret.  Verified in TASK-19.1: Bearer-
      authenticated POST to `https://inference-api.nvidia.com/v1/chat/completions`
      using model id `nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`
      returned HTTP 200 with a text response.  The opt-in smoke check
      (`make smoke-nemotron`) uses a redacted key hint and never logs the
      raw credential.
- [x] CRIT-2: A backend `/api/chat` service can call the selected
      Nemotron model with current Aethel agent/environment context while
      keeping NVIDIA credentials server-side only.  Implemented in
      TASK-19.2 (FastAPI backend), TASK-19.3 (NvidiaClient + prompt
      builder), and TASK-19.4 (provider selection).  Credentials are read
      from env/netrc server-side; the frontend never sees them.
- [x] CRIT-3: The frontend can choose between the existing mock adapter
      and the backend API adapter without changing the `ChatPanel`
      contract or exposing model-provider secrets.  Implemented in
      TASK-19.4: `VITE_CHAT_PROVIDER=api` switches the browser to POST
      `/api/chat`; `mock` (default) uses the in-browser stub.  ChatPanel
      contract is unchanged.
- [x] CRIT-4: Unit/component tests cover prompt construction, credential
      loading, mocked NVIDIA failures/successes, frontend adapter
      behavior, and chat error preservation.  Covered by `api/tests/`
      (config, nvidia_client, prompt_builder, routes) and
      `scripts/nemotron/test_nemotron_smoke_check.py` (smoke-check unit
      tests).  Frontend adapter tests cover both mock and API paths.
- [x] CRIT-5: User docs describe how to configure credentials, run the
      backend/model adapter, keep mock mode as fallback, and run the
      opt-in live smoke check.  Documented in `docs/nemotron-chat.md`
      (credential config, env vars, mock-only mode, live Nemotron mode,
      opt-in smoke check, unit tests) and `README.md` (Nemotron Chat
      section).  Completed in TASK-19.5 and TASK-19.6.
