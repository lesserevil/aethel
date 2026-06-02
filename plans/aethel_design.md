# NVIDIA-Powered Aethel Design

Status: Draft
Last technology review: June 2, 2026

A virtual world where agents run and communicate in real time, with a
mutable environment and runtime-modifiable agents.

## Core Concept

A persistent, interactive 3D simulation environment powered by current
NVIDIA technologies where AI agents inhabit realistic spaces and can be
dynamically modified during runtime. Users can communicate with agents
via natural language, voice, and multimodal inputs, and both the world
and the agents can be altered on the fly.

The stack below is intentionally tied to currently supported NVIDIA
release lines or clearly marked early-access components. Avoid invented
major versions such as "Omniverse Kit 2.0" or "NeMo Guardrails 2.0"
unless NVIDIA publishes those names in official release notes.

## Technology Stack (Reviewed June 2, 2026)

### Simulation and Rendering Foundation

- **NVIDIA Omniverse Kit SDK 110.x** - Use the current Kit SDK release
  line as the foundation for custom Kit apps and extensions. The current
  release reviewed for this plan is Kit 110.1.1, released in April 2026,
  with Blackwell GPU fixes, rendering stability updates, CAD conversion
  updates, and Fabric Scene Delegate fixes.
- **Omniverse RTX Renderer 110.x** - Use RTX Real-Time 2.0 and RTX
  Interactive Path Tracing for visual fidelity. RTX 110.1 adds native
  rendering for OpenUSD Particle Fields / 3D Gaussian Splats, an RTX
  Minimal mode for low-latency training workflows, and updated MDL /
  Iray / Neuray libraries.
- **NVIDIA PhysX SDK 5.6.x / Omniverse Physics** - Use PhysX 5.6.x and
  USD Physics for rigid bodies, articulations, soft bodies, cloth,
  particles, and robotics-ready physics authoring. The old "PhysX 5.3"
  target should be treated as stale.
- **NVIDIA Isaac Sim 5.1.0 GA** - Use Isaac Sim 5.1.0 as the current
  GA robotics simulation baseline. Isaac Sim 6.0 is an early developer
  release with incomplete docs and source-build-only availability, so it
  should not be the default baseline until GA artifacts are available.
- **NVIDIA DLSS 4** - Keep DLSS 4 as an optional client-side performance
  feature for RTX interactive rendering. Do not make it a hard server or
  simulation dependency.
- **OpenUSD 26.05 / NVIDIA OpenUSD Exchange SDK** - Author world state
  in OpenUSD and track the USD version shipped with the selected Kit /
  Isaac Sim release. NVIDIA's usd-exchange tooling is currently tied to
  USD 25.05, while upstream OpenUSD documentation is at 26.05.
- **SimReady assets and validation** - Use SimReady assets, Asset
  Validator, and OpenUSD asset structure rules rather than the older
  "Omniverse Library 2026" phrasing. Omniverse Launcher and Nucleus
  Workstation were deprecated on October 1, 2025.

### AI Agent Infrastructure

- **NVIDIA NIM microservices** - Primary deployment path for supported
  NVIDIA-optimized model serving across language, speech, vision,
  retrieval, and digital-human models.
- **NVIDIA Triton Inference Server 26.05 / 2.69.0** - Current reviewed
  Triton container release, with CUDA 13.2.1, TensorRT 10.16.1.11,
  TensorRT-LLM release/1.2.1, and vLLM 0.20.1. Use Triton directly for
  custom backends or behind NIM where appropriate.
- **NVIDIA NeMo Framework 26.02** - Use NeMo Framework for model
  training, post-training, customization, export, and speech/model
  development. Avoid pinning to "NeMo 2.5" as the plan's current release
  label.
- **NVIDIA NeMo microservices** - Use NeMo Retriever, Customizer,
  Evaluator, and Guardrails where the project needs production agent
  services rather than only library-level development.
- **NVIDIA NeMo Guardrails library / NeMo Platform Guardrails** - Use
  Guardrails for programmable safety checks. The current library release
  reviewed is v0.22.0; the production service is documented under NeMo
  Platform Guardrails. Do not refer to "NeMo Guardrails 2.0" unless that
  release appears in official NVIDIA documentation.
- **NVIDIA Speech NIM Microservices / Riva SDK 2.24.0** - For x86 data
  center deployments, prefer Speech NIM Microservices, which consolidate
  Riva ASR, TTS, and NMT NIMs under calendar versioning. Riva SDK 2.24.0
  is the current embedded-platform SDK release; its x86 data center path
  is deprecated.
- **Audio2Face-3D NIM 2.0** - Use Audio2Face-3D NIM for avatar facial
  animation and digital-human expression instead of assuming an older
  standalone Audio2Face application flow.

### Current NVIDIA Model Selection

- **Primary reasoning LLM**: NVIDIA Nemotron 3 Super 120B-A12B
  (including NVFP4 variants where the target Blackwell infrastructure
  supports them) for complex agentic reasoning, coding, long-context
  analysis, and tool use.
- **Efficient text agent**: NVIDIA Nemotron 3 Nano 30B-A3B for lower
  latency, lower cost text agents that still need long context and tool
  calling.
- **Multimodal perception agent**: NVIDIA Nemotron 3 Nano Omni for
  unified video, image, audio, and text reasoning in one model.
- **Safety and moderation**: NVIDIA Nemotron 3 Content Safety and
  Nemotron Content Safety Reasoning 4B for model-level safety checks,
  composed through NeMo Guardrails.
- **World foundation models**: NVIDIA Cosmos Predict2.5, Transfer2.5,
  and Reason2 for physical-AI world prediction, video/world-state
  generation, simulation-to-photoreal transfer, and physical reasoning.
  Cosmos Predict1 Text2World examples may still be useful, but they are
  no longer the primary current target.
- **Speech models**: NVIDIA Speech NIM / Riva-backed Nemotron speech
  models for ASR, TTS, and translation.

### Runtime Mutation System

- **OpenUSD live editing** - Represent mutable world state as OpenUSD
  stages, layers, variants, payloads, and references.
- **Session transactions** - Wrap scene mutations in explicit
  transactions with validation, rollback, and audit records.
- **Kit extensions matching Kit 110.x** - Build live editing controls as
  Kit extensions against the selected Kit SDK release line. Avoid
  claiming a separate "Omniverse Kit Extensions Framework 3.0" unless
  NVIDIA publishes that versioned name.
- **Model routing and adapter updates** - Support agent updates through
  NIM route changes, NeMo post-training artifacts, LoRA/adapters where
  supported, and guardrail configuration reloads.
- **Zero-downtime model changes** - Treat hot-swapping as a target
  behavior requiring staged rollout, health checks, prompt/config
  compatibility checks, and rollback, not as a guaranteed primitive.

### Communication Interface

- **WebSocket command channel** - Primary low-latency bidirectional
  channel for user commands, agent events, and mutation status.
- **OpenAPI REST control plane** - Configuration, lifecycle,
  administrative actions, and trace/audit retrieval.
- **GraphQL subscriptions** - Optional query-oriented API if the UI
  needs selective state subscriptions.
- **Voice interface** - Speech NIM / Riva-backed ASR and TTS.
- **AR/VR support** - OpenXR through Kit/RTX where supported by the
  target deployment. Keep XR support optional until the first app proves
  device/runtime compatibility.

## Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

1. Set up an Omniverse Kit 110.x application with RTX Real-Time 2.0,
   RTX Interactive Path Tracing, and Python 3.12-compatible extensions.
2. Create a basic physically realistic room using OpenUSD, USD Physics,
   PhysX 5.6.x, SimReady materials, and Asset Validator checks.
3. Deploy a single text agent through NVIDIA NIM or Triton 26.05 using
   Nemotron 3 Nano 30B-A3B as the default efficient model; allow
   Nemotron 3 Super 120B-A12B as a high-capacity deployment option.
4. Establish a WebSocket command channel with JSON messages for user
   commands, agent replies, and world mutation events.

### Phase 2: Realism and World Generation (Weeks 4-6)

1. Integrate Cosmos Predict2.5 / Transfer2.5 / Reason2 for world-state
   generation, synthetic data generation, transfer to photorealistic
   video, and physical reasoning.
2. Use SimReady assets, DSX-style content packs where applicable, and
   OpenUSD Exchange SDK tooling for asset ingestion and validation.
3. Implement advanced lighting and materials with RTX Renderer 110.x,
   MDL / OpenPBR materials, and path-tracing previews.
4. Add environmental audio and voice interaction using Speech NIM for
   x86 data center deployments or Riva SDK 2.24.0 for supported
   embedded deployments.
5. Refine physics interactions with PhysX 5.6.x soft body, cloth,
   particle, rigid-body, and articulation capabilities.

### Phase 3: Agent Intelligence (Weeks 7-9)

1. Deploy specialized agents using Nemotron 3 Super for complex
   reasoning and Nemotron 3 Nano 30B-A3B for efficient roles.
2. Implement agent memory with retrieval-augmented generation using
   vector search plus NeMo Retriever where appropriate.
3. Add multimodal perception with Nemotron 3 Nano Omni and Cosmos
   Reason2 for world-state/video reasoning.
4. Add emotional expression through Speech NIM / Riva TTS and
   Audio2Face-3D NIM.
5. Integrate NeMo Guardrails and Nemotron content-safety models for
   input checks, output checks, topic control, and auditability.

### Phase 4: Runtime Mutability (Weeks 10-12)

1. Build a USD modification API with transactional scene edits,
   validation, rollback, and event emission.
2. Create an agent behavior modification system using prompt/config
   updates, NeMo post-training artifacts, adapters, and NIM route
   changes where supported.
3. Implement world-state versioning using Git-LFS or another
   large-asset-aware storage strategy for USD files and generated media.
4. Add a user-friendly live editing interface using Kit UI / ImGui-style
   controls, with clear mutation status and undo/redo.

## Key Runtime Mutation Capabilities

### World Modification

- **Procedural scenario generation**: Use Cosmos Predict2.5 and
  Transfer2.5 to generate physics-aware world-state media and scenarios.
- **Geometry editing**: Add, remove, and modify OpenUSD prims, walls,
  furniture, lights, cameras, and sensors with live preview.
- **Material changes**: Update MDL / OpenPBR material parameters and
  SimReady physics/sensor metadata.
- **Lighting control**: Adjust time of day, dome lights, mesh lights,
  exposure, and path-traced previews.
- **Environmental effects**: Weather, particles, ambient audio, and
  sensor simulation where the selected Kit/RTX/Isaac Sim release
  supports them.
- **Physics parameters**: Gravity, friction, restitution, articulation
  properties, and contact behavior with real-time validation.

### Agent Modification

- **Model routing**: Shift between efficient and high-capacity Nemotron
  models through NIM/Triton routing rather than hard-coded model names.
- **Adapter and post-training updates**: Apply LoRA/adapters or NeMo
  post-training artifacts where the selected model path supports them.
- **Personality parameters**: Adjust style, tone, formality, curiosity,
  and task focus through prompt/config policy.
- **Knowledge base updates**: Inject new information through RAG and
  retriever index updates.
- **Voice characteristics**: Change TTS voice, speaking style, and
  supported emotional characteristics using Speech NIM / Riva options.
- **Perception updates**: Route multimodal state to Nemotron 3 Nano Omni
  and Cosmos Reason2 rather than relying on a stale VLM target.

### Communication Protocol

- **Natural language commands**: "Generate a forest clearing", "Make the
  agent more skeptical", or "Replace the table with a workbench".
- **Multimodal input**: Combine voice, pointer/gesture events, gaze, and
  selected scene objects.
- **Visual feedback**: Preview changes immediately with RTX rendering
  while background validation completes.
- **Undo/redo**: Implement safe experimentation through USD session
  transactions and versioned world states.
- **Perspective shifting**: Switch between first-person, third-person,
  top-down, agent-view, and sensor-view perspectives.

## Safety and Governance

- **Change validation**: Reject unsafe or invalid world edits with
  schema validation, constraints, and Asset Validator checks.
- **Permission model**: Separate permissions for scene edits, physics
  edits, agent prompt/config edits, model routing, and knowledge updates.
- **Audit trail**: Record mutation requests, validation results,
  applied USD layer changes, model/config versions, and actor identity.
- **Reset mechanisms**: Provide one-click return to known-good baseline
  worlds and agent configurations.
- **AI safety**: Combine NeMo Guardrails, Nemotron safety models, and
  trace logging for input/output checks and policy enforcement.

## Aethel-Specific Enhancements

### Old English Inspiration

- **Naming convention**: Use Anglo-Saxon-inspired terms for world
  elements, such as "holm" for islets and "denu" for valleys.
- **Environmental themes**: Optionally generate medieval-inspired
  environments while preserving physically plausible simulation.
- **Agent personalities**: Optionally create agents with historically
  inspired speech style, while keeping safety and clarity constraints.

### Technical Innovations

- **Agent learning loop**: Use post-training and retrieval updates while
  preserving privacy, auditability, and rollback.
- **Neural rendering and scene caches**: Cache expensive material,
  lighting, and sensor evaluations where RTX/Kit APIs expose supported
  mechanisms.
- **Predictive mutation**: Suggest likely world or agent changes based
  on user interaction patterns, but keep user confirmation for
  destructive changes.
- **Cross-reality persistence**: Save Aethel states that can resume
  across desktop, cloud streaming, and XR sessions.

## Acceptance Criteria

- [ ] CRIT-1: The design doc's NVIDIA technology stack uses official
      current release lines or explicitly marks early-access/non-GA
      components; verified by comparing the "Current NVIDIA Sources
      Reviewed" links against the stack above.
- [ ] CRIT-2: The implementation phases reference supported GA baselines
      for Omniverse Kit, Isaac Sim, PhysX, Triton, Speech/Riva, Cosmos,
      and Nemotron; unsupported or stale names are removed or marked as
      historical.
- [ ] CRIT-3: Runtime mutation and model-swapping claims are written as
      implementation targets with validation and rollback requirements,
      not as assumed zero-downtime guarantees.
- [ ] CRIT-4: A future implementation task can be created from each phase
      without needing external conversation context; each task should cite
      this plan path and mirror the relevant acceptance criterion.

## Current NVIDIA Sources Reviewed

- Omniverse Kit release notes:
  https://docs.omniverse.nvidia.com/dev-guide/latest/release-notes.html
- RTX Renderer 110.1 release notes:
  https://docs.omniverse.nvidia.com/materials-and-rendering/latest/rtx-renderer-release-notes/110_1.html
- Isaac Sim latest release/downloads:
  https://docs.isaacsim.omniverse.nvidia.com/latest/installation/download.html
- PhysX SDK releases:
  https://github.com/NVIDIA-Omniverse/PhysX/releases
- DLSS:
  https://developer.nvidia.com/rtx/dlss
- NVIDIA NIM:
  https://docs.nvidia.com/nim/
- NeMo Framework:
  https://docs.nvidia.com/nemo-framework/user-guide/26.02/index.html
- Triton Inference Server 26.05 release notes:
  https://docs.nvidia.com/deeplearning/triton-inference-server/release-notes/rel-26-05.html
- Riva SDK release notes:
  https://docs.nvidia.com/deeplearning/riva/user-guide/docs/release-notes.html
- NVIDIA Speech NIM Microservices release notes:
  https://docs.nvidia.com/nim/speech/latest/about/release-notes.html
- NeMo Guardrails releases:
  https://github.com/NVIDIA-NeMo/Guardrails/releases
- NeMo Platform Guardrails:
  https://docs.nvidia.com/nemo/microservices/latest/guardrails/checks.html
- Cosmos documentation:
  https://docs.nvidia.com/cosmos/latest/index.html
- Nemotron 3 agent models overview:
  https://developer.nvidia.com/blog/building-nvidia-nemotron-3-agents-for-reasoning-multimodal-rag-voice-and-safety/
- Nemotron 3 Super NIM model card:
  https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b/modelcard
- Audio2Face-3D NIM:
  https://docs.nvidia.com/nim/digital-human/a2f-3d/latest/index.html
- OpenUSD 26.05:
  https://openusd.org/release/index.html
- NVIDIA OpenUSD Exchange SDK changelog:
  https://docs.omniverse.nvidia.com/usd/code-docs/usd-exchange-sdk/latest/docs/changes.html
- Omniverse Launcher legacy/deprecation notice:
  https://developer.nvidia.com/omniverse/legacy-tools
- SimReady overview:
  https://docs.omniverse.nvidia.com/simready/latest/index.html
