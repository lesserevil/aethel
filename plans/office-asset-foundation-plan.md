# Office Asset Foundation Plan

Status: Draft
Created: June 5, 2026

## Purpose

Aethel needs a standard office environment made from real, inspectable
assets instead of only procedural primitives. The first implementation
should stay cheap, web-friendly, and compatible with the current React
Three Fiber MVP.

This plan starts with free office assets in GLB/glTF form. It does not
make OpenUSD, Omniverse Kit, Newton, or PhysX a requirement for the
current MVP runtime. Those systems become useful after the project has a
repeatable asset catalog and conversion pipeline.

## Recommended Free Sources

Use these sources in order:

1. **Kenney Furniture Kit on Poly Pizza** - Primary source for standard
   furniture and office-scale props. The pack is listed as Public Domain
   (CC0), has 100+ models, and offers GLTF and FBX downloads.
2. **Eclair Everyday Home & Desk Props GLB Pack** - Supplemental source
   for desk clutter and small everyday props. The pack is free, CC0, and
   ships individual GLB files.
3. **Poly Haven** - Supplemental source for CC0 HDRIs, materials, and
   occasional higher-quality props.
4. **The Base Mesh** and **CG3D** - Gap-fill sources for CC0/public
   domain meshes when Kenney and Eclair do not cover a needed object.

Avoid attribution-required sources in the first pass. Sketchfab CC-BY
assets can be useful later, but only after Aethel has an attribution
surface and license manifest that can prove attribution is preserved.
Avoid unverified "free" asset packs until their license text is checked
and stored with the asset metadata.

## MVP Asset Set

The first standard office scene should include these props:

- desk
- chair
- laptop
- keyboard
- monitor or screen
- trash can
- small lamp or desk accessory
- two or three clutter objects such as books, cups, notebooks, or boxes

The initial goal is a believable, low-poly office baseline. Photorealism,
animation, articulated furniture, destructible objects, and character
assets are out of scope for this plan.

## Repository Layout

Use a small, explicit layout:

```text
web/public/assets/office/
  <optimized runtime .glb files>

web/src/assets/
  officeAssetManifest.ts
```

If raw downloaded archives or source-format files are needed, keep them
outside the repo until a Git LFS policy exists. Commit only optimized
runtime assets that are small enough for normal repository history. If a
selected asset would materially bloat the repository, file a follow-up
task for Git LFS or external object storage before committing it.

## Asset Manifest Contract

Every runtime asset must be represented in a typed manifest. A manifest
entry should include:

- stable `id`
- display `label`
- category such as `furniture`, `device`, `container`, or `clutter`
- local `url` under `/assets/office/`
- source name and source URL
- license identifier and license URL
- preferred transform: position, rotation, scale
- approximate dimensions in meters
- simple collider hint: box, cylinder, convex hull, or none
- optional affordances such as `seatable`, `work-surface`, `input-device`,
  or `waste-container`

The manifest is both runtime data and provenance data. Do not add an
asset without enough metadata for a future USD conversion step to trace
where it came from and what license applies.

## Web Runtime Integration

The current MVP should load GLB files directly in the browser with the
existing Three.js/React Three Fiber stack. Use `GLTFLoader` or the
project's established React Three Fiber helpers through a local asset
component boundary.

The viewport should:

- render the office assets from the manifest;
- use procedural fallback geometry while an asset is loading or when a
  test intentionally mocks the loader;
- handle missing or failed assets with a visible but nonfatal fallback;
- preserve existing camera framing, lighting controls, object toggles,
  and chat/control synchronization;
- avoid network requests to third-party asset hosts at runtime.

## State and Controls

Extend the existing environment object model instead of creating a second
asset-specific state tree. Environment objects should gain enough fields
to connect a scene object to a manifest asset:

- `assetId`
- `enabled`
- `transform`
- `collider`
- `affordances`

The left control panel can keep using object toggles at first. Rich
placement, drag/drop editing, inventory browsing, and asset import UI are
separate future work.

## Tests and Verification

The implementation must include focused tests:

- manifest tests that assert every asset has a local URL, source URL,
  license, transform, and collider hint;
- state/reducer tests for adding or toggling manifest-backed objects;
- viewport/component tests with the GLB loader mocked so tests are not
  brittle on WebGL internals;
- Playwright coverage that catches missing runtime assets, verifies the
  standard office preset renders nonblank, and verifies object toggles
  affect visible scene state.

## Out of Scope

- OpenUSD as the authoritative scene format. That is covered by
  `plans/usd-scene-pipeline-plan.md`.
- Newton, PhysX, Isaac Sim, or Omniverse Kit runtime integration. That is
  covered by `plans/office-physics-simulation-plan.md`.
- Paid asset sources.
- Attribution-required assets unless a separate attribution workflow
  exists.

## Backlog Implementation Map

- TASK-16: Build free office asset foundation for the Aethel MVP.
- TASK-16.1: Select and license-audit the first free office asset set.
- TASK-16.2: Add typed office asset manifest and environment asset
  fields.
- TASK-16.3: Implement GLB office asset loader boundary with fallbacks.
- TASK-16.4: Render the standard office preset with local GLB props.
- TASK-16.5: Verify office asset rendering and document the runtime
  workflow.

## Sources Reviewed

Reviewed June 5, 2026:

- Kenney Furniture Kit on Poly Pizza:
  https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z
- Eclair Everyday Home & Desk Props GLB Pack:
  https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models
- Poly Haven about/license notes:
  https://polyhaven.com/about-contact
- The Base Mesh:
  https://www.thebasemesh.com/
- CG3D:
  https://cg3d.org/

## Acceptance Criteria

- [ ] CRIT-1: A documented free asset selection exists for the standard
      office scene, and every selected asset has source URL, license URL,
      local runtime path, and provenance metadata covered by a manifest
      test.
- [ ] CRIT-2: The web MVP loads office GLB assets from
      `web/public/assets/office/` through a typed manifest and preserves
      deterministic fallback rendering when asset loading is mocked or an
      asset fails.
- [ ] CRIT-3: The standard office preset includes desk, chair, laptop,
      keyboard, monitor/screen, trash can, and at least three clutter or
      accessory props, verified by component tests and a Playwright
      nonblank viewport check.
- [ ] CRIT-4: Existing environment controls can enable/disable
      manifest-backed office objects without breaking chat context,
      mutation logging, or reset behavior; verified by unit/component
      tests.
- [ ] CRIT-5: No paid, attribution-required, or externally hosted runtime
      assets are required by the default MVP scene.
