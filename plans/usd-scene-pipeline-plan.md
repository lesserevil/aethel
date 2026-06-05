# USD Scene Pipeline Plan

Status: Draft
Created: June 5, 2026

## Purpose

Aethel should eventually use OpenUSD as the authoritative scene format
for realistic agent environments. USD gives the project composition,
references, variants, payloads, metadata, validation, and compatibility
with Omniverse, Isaac Sim, RTX rendering, and Newton/PhysX-style physics
pipelines.

The current web MVP should not wait for this pipeline. GLB remains the
browser runtime format for the first office scene. This plan defines the
path from free GLB/glTF office assets to canonical USD stages and back to
web-ready GLB exports.

## Positioning

Use two representations:

- **Canonical simulation representation**: OpenUSD files under
  `assets/usd/`.
- **Web runtime representation**: optimized GLB files under
  `web/public/assets/office/`.

The USD stage is the source of truth once this plan is complete. The web
assets become generated runtime exports or consciously mirrored copies.

## Repository Layout

Target layout:

```text
assets/
  sources/
    office/
      README.md
      licenses/
      manifest.json
  usd/
    office/
      office.usda
      props/
      materials/
      lights/
      cameras/
  exports/
    web/
      office/

scripts/
  assets/
    convert-office-assets.*
    validate-usd.*
    export-web-assets.*

web/public/assets/office/
  <web runtime .glb files>
```

Do not commit large raw downloads until the project has a Git LFS or
external artifact policy. Source manifests and license files should be
small and committed. Runtime GLB assets may be committed only when their
size is acceptable for normal git history.

## USD Stage Shape

The standard office stage should use a predictable hierarchy:

```text
/World
  /Office
    /Architecture
    /Furniture
    /Devices
    /Containers
    /Clutter
  /Lights
  /Cameras
```

The root layer should define:

- default prim;
- meters-per-unit;
- up axis;
- a named camera suitable for the MVP web framing;
- baseline lighting;
- references or payloads to reusable prop assets;
- source and license metadata for every referenced asset.

Use separate prop assets when a desk, chair, laptop, keyboard, trash can,
or other object can be reused in multiple scenes. Use the root office
stage for placement, lighting, and composition.

## Conversion Tooling

Start with the simplest reliable conversion path:

1. Use Blender in non-interactive mode to import source glTF/GLB/FBX
   assets, normalize orientation and scale, and export USD and GLB.
2. Use OpenUSD Python tooling for metadata, composition, and validation
   where Blender alone is insufficient.
3. Add NVIDIA OpenUSD Exchange SDK only when the project needs custom
   converter code or stronger USD authoring helpers.
4. Add Omniverse Kit-based tooling only when headless OpenUSD/Blender
   tooling cannot meet a requirement.

The scripts should be wrapped by Makefile targets once they exist:

- `make assets-build`
- `make assets-validate`
- `make assets-export-web`

The exact implementation language can be Python or shell around Blender,
but the Make targets are the public interface.

## Validation

Validation is layered and implemented via `make assets-validate`:

1. **Structural stage validation** (`scripts/assets/validate-usd-stage.py`) —
   pure Python, no usd-core required.  Checks prim hierarchy, stage metadata,
   lights, camera, and prop references.

2. **Web manifest mapping validation** (`scripts/assets/validate-web-manifest.py`) —
   pure Python, no external tools required.  Verifies every web office manifest
   entry (`web/src/assets/officeAssetManifest.ts`) has a USD prim path and source
   manifest record.  Uses `assets/usd/office/web-asset-map.json` as the mapping
   artifact.  Fails loudly on any unmapped web asset.

3. **USD schema validation** (`usdchecker` / `usd-core`) — optional.  Runs when
   `usd-core` is installed; skips cleanly when not available.

4. **Omniverse Asset Validator** (`omni.asset_validator`) — optional.  Skips
   cleanly when not installed.  Accessible via `--omniverse` flag on the
   validate-web-manifest.py script.

5. **SimReady Foundation validation** — future task when physics/semantic
   metadata is sufficient to target a SimReady profile.

The mapping artifact `assets/usd/office/web-asset-map.json` explicitly links
each web manifest ID to a source manifest ID and USD prim path, preventing the
web scene from drifting away from canonical USD provenance.  Its schema lives at
`assets/sources/office/web-asset-map.schema.json`.

Validation must run locally without requiring a full Omniverse desktop
application. Optional richer validation may be documented separately if
it requires NVIDIA-specific packages, Kit, or a GPU.

If a future validation, conversion, or export task changes GPU support
from optional to required, it must update the user docs and state whether
the requirement applies to the client/browser workflow, the server/tooling
workflow, or both. The default MVP `make run` path must remain documented
separately from any GPU-backed asset pipeline.

## Web Export Contract

The web MVP should never parse USD directly in the browser unless a later
task proves that path is better. Export GLB for the runtime and keep a
mapping file so UI state can connect web objects back to USD prim paths:

```json
{
  "assetId": "office-desk-001",
  "usdPrimPath": "/World/Office/Furniture/Desk_001",
  "webUrl": "/assets/office/desk.glb"
}
```

The mapping should also preserve license and source metadata so the web
runtime manifest and USD source manifest cannot drift silently.

## Documentation

User-facing asset commands belong in `docs/` once Make targets exist.
Implementation design, conversion constraints, and known limitations stay
in `plans/`.

At minimum, future user docs should explain:

- how to rebuild office assets;
- what optional tools are required;
- where runtime assets live;
- how to run validation;
- how to add another free asset without bypassing provenance metadata.

## Out of Scope

- Live USD editing from the chat panel.
- Nucleus, Omniverse streaming, or cloud asset storage.
- Production-grade CAD conversion.
- SimReady certification for every prop in the first pass.
- Newton/PhysX runtime integration. Physics authoring is covered by
  `plans/office-physics-simulation-plan.md`.

## Backlog Implementation Map

- TASK-17: Establish canonical USD scene pipeline for Aethel office
  assets.
- TASK-17.1: Create the office asset source and USD artifact layout.
- TASK-17.2: Add noninteractive asset pipeline Make targets.
- TASK-17.3: Build the canonical OpenUSD office stage.
- TASK-17.4: Validate USD assets and web manifest mapping.
- TASK-17.5: Export canonical USD office assets to web GLB outputs.

## Sources Reviewed

Reviewed June 5, 2026:

- OpenUSD introduction and composition concepts:
  https://openusd.org/docs/index.html
- NVIDIA Learn OpenUSD data exchange:
  https://docs.nvidia.com/learn-openusd/latest/data-exchange/data-exchange/index.html
- NVIDIA OpenUSD Exchange SDK:
  https://docs.omniverse.nvidia.com/usd/code-docs/usd-exchange-sdk/latest/index.html
- OpenUSD Exchange SDK authoring USD data:
  https://docs.omniverse.nvidia.com/usd/code-docs/usd-exchange-sdk/latest/docs/authoring-usd.html
- NVIDIA Learn OpenUSD asset validation:
  https://docs.nvidia.com/learn-openusd/latest/data-exchange/asset-validation/index.html
- Omniverse Asset Validator:
  https://docs.omniverse.nvidia.com/kit/docs/asset-validator/latest/source/python/docs/index.html
- SimReady FAQ:
  https://docs.omniverse.nvidia.com/simready/latest/simready-faq.html

## Acceptance Criteria

- [ ] CRIT-1: The repo has an `assets/` pipeline layout with committed
      source/provenance manifests, license notes, canonical office USD
      files, and web export outputs or documented placeholders.
- [ ] CRIT-2: `make assets-build`, `make assets-validate`, and
      `make assets-export-web` exist, are documented in user docs, and
      run non-interactively from the repo root.
- [ ] CRIT-3: The standard office USD stage has default prim, units,
      up-axis metadata, reusable prop references or payloads, a camera,
      lights, and source/license metadata for every asset; verified by a
      validation script.
- [ ] CRIT-4: The web asset manifest can be checked against the USD
      mapping so each runtime GLB object has a corresponding USD prim path
      and source manifest entry.
- [ ] CRIT-5: USD validation runs locally without requiring Omniverse
      desktop, Nucleus, RTX rendering, or a GPU; optional NVIDIA-specific
      validation is clearly documented as optional.
