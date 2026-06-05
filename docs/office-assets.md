# Office Assets — Runtime Workflow

This document describes how the Aethel MVP loads and manages the 3D office
scene assets at runtime. Read it to understand where the files live, how
provenance is tracked, how to add a new prop, and why the MVP uses GLB
directly rather than requiring OpenUSD or a physics engine.

---

## Where runtime GLB assets live

All runtime office assets are in one directory:

```
web/public/assets/office/
```

Vite serves this directory under `/assets/office/` so every GLB is
available at a path like `/assets/office/office-desk.glb`.

The files in this directory are the **only** assets the browser requests at
runtime. The app never fetches from external asset hosts (Poly Pizza, itch.io,
or any CDN) during a live session.

### Current file list

| Filename | Asset label |
|---|---|
| `office-desk.glb` | Office Desk |
| `office-chair.glb` | Office Chair |
| `office-monitor.glb` | Monitor |
| `office-laptop.glb` | Laptop |
| `office-keyboard.glb` | Keyboard |
| `office-trash-can.glb` | Trash Can |
| `office-desk-lamp.glb` | Desk Lamp |
| `office-book-stack.glb` | Book Stack |
| `office-coffee-cup.glb` | Coffee Cup |
| `office-notebook.glb` | Notebook |

All ten files are included in the repository under `web/public/assets/office/`.
They are small enough to stay in normal Git history without LFS.

---

## Where source and provenance are documented

Every asset's source pack, publisher, license type, license URL, and original
download URL are recorded in:

```
docs/office-asset-sources.md
```

That document is the single place to trace where each file came from and
confirm the license is CC0 / public domain. Do not commit a new GLB to
`web/public/assets/office/` without first adding a row to that table.

The asset metadata is also duplicated at runtime in the typed manifest:

```
web/src/assets/officeAssetManifest.ts
```

The manifest stores the same provenance fields (`sourceName`, `sourceUrl`,
`licenseId`, `licenseUrl`) as plain serializable data alongside the scene
placement transform, dimensions, and collider hint. Tests in
`web/src/assets/officeAssetManifest.test.ts` assert that every manifest entry
has all required provenance fields filled.

---

## How the assets are loaded at runtime

The runtime flow is:

```mermaid
flowchart LR
    A[baselineSession.ts\ndefault SceneObjectState[]] --> B[SessionProvider\nReact context]
    B --> C[SceneObjects.tsx\nfor each enabled object]
    C --> D{assetId\npresent?}
    D -- yes --> E[OfficeAsset.tsx\nSuspense + ErrorBoundary]
    E --> F[useGLTF\n@react-three/drei]
    F --> G[GLB file\n/assets/office/*.glb]
    D -- no --> H[ProceduralObject\nwireframe primitive]
    E -- load error --> H
```

1. `baselineSession.ts` defines the default session state, including ten
   scene objects that each carry an `assetId` string (e.g. `"office-desk"`).
2. `SceneObjects.tsx` reads the enabled objects from session state. For each
   object with an `assetId`, it looks up the manifest entry via `getAssetById`
   and renders `OfficeAsset`.
3. `OfficeAsset.tsx` wraps `useGLTF(entry.url)` inside a React `Suspense`
   boundary and a class-based `ErrorBoundary`. While the GLB is loading,
   or if it fails to parse, a deterministic wireframe fallback box is shown
   instead. The scene framing is stable in every state.
4. The viewport wrapper div (`data-testid="aethel-viewport"`) exposes test
   attributes including `data-environment-preset` and `data-enabled-objects`
   so e2e tests can assert scene state without querying Three.js objects.

---

## How to add a new free office asset

Follow these steps in order:

1. **Verify the license.** Open the publisher page (not just a marketplace
   tag). Confirm the asset is CC0 or public domain. Copy the license URL.
   If the license requires attribution, do not add the asset until Aethel
   has a shipped credits surface.

2. **Add provenance to `docs/office-asset-sources.md`.** Add a row to
   the **Selected Assets** table with every column filled: asset ID, object
   label, source pack, source URL, license, license URL, original format,
   intended runtime filename, and any notes. Add a coverage-checklist row
   if the asset fills a new category.

3. **Optimize and place the GLB.** Export or download the asset in GLB
   format. If the source ships a different format (FBX, OBJ), convert it
   to GLB before committing. Keep the file small — avoid embedded textures
   larger than 1 MB for the MVP. Copy the optimized GLB to
   `web/public/assets/office/<your-filename>.glb`.

4. **Add a manifest entry to `web/src/assets/officeAssetManifest.ts`.**
   Fill every field:

   ```ts
   {
     id: "office-my-prop",           // stable, kebab-case, no spaces
     label: "My Prop",
     category: "clutter",            // furniture | device | container | clutter
     url: "/assets/office/office-my-prop.glb",
     sourceName: "Kenney Furniture Kit",
     sourceUrl: "https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z",
     licenseId: "CC0-1.0",
     licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
     defaultTransform: {
       position: { x: 0, y: 0, z: 0 },
       rotation: { x: 0, y: 0, z: 0 },
       scale:    { x: 1, y: 1, z: 1 },
     },
     dimensions: { width: 0.2, height: 0.3, depth: 0.2 }, // meters
     colliderHint: "box",
   }
   ```

5. **Add the scene object to `web/src/state/baselineSession.ts`** (if it
   should appear in the default office scene). Add a `SceneObjectState`
   entry in `environment.objects` with `enabled: true` and the matching
   `assetId`.

6. **Run the test suite.** Manifest tests will fail immediately if any
   required provenance field is missing:

   ```bash
   make test
   ```

7. **Run a build check.**

   ```bash
   make build
   ```

8. **Commit both the GLB and the manifest/state changes together** so the
   repo is never in a state where the manifest references a file that does
   not exist.

---

## Why the MVP uses GLB directly instead of OpenUSD or a physics engine

The current office scene is intentionally simple:

- **No GPU required.** The scene renders in any WebGL-capable browser on
  any consumer GPU. There is no CUDA, OptiX, or hardware ray-tracing
  dependency.
- **No physics engine required.** Objects are static props. Newton, PhysX,
  Isaac Sim, and Omniverse Kit are not required to view or configure the
  default scene.
- **No OpenUSD required.** GLB (glTF binary) is the native asset format for
  Three.js and React Three Fiber, which are already used by the MVP. Adding
  USD as a runtime format would require a USD runtime library in the browser,
  which has no mature web equivalent today.
- **Provenance-compatible.** The manifest stores the same metadata that a
  future USD conversion pipeline would need (`sourceUrl`, `licenseId`,
  `colliderHint`, dimensions). When that pipeline is built, it can read the
  manifest without any data migration.
- **Asset failures are non-fatal.** If a GLB fails to parse, the
  `AssetErrorBoundary` in `OfficeAsset.tsx` silently substitutes a wireframe
  fallback box. The viewport never goes blank because of a missing asset.

The paths toward USD, physics simulation, and Omniverse integration are
planned in separate documents:

- `plans/usd-scene-pipeline-plan.md` — USD authoring and conversion
- `plans/office-physics-simulation-plan.md` — Newton/PhysX integration

Neither is required for the default MVP office scene.

---

## Running the tests

| Command | What it does |
|---|---|
| `make test` | Runs unit and component tests, including manifest completeness checks |
| `make test-e2e` | Runs Playwright browser tests, including office asset HTTP checks |
| `make build` | TypeScript compile + Vite production build |
| `make fmt-check` | Verifies formatting without modifying files |

The e2e tests require a Chromium-compatible browser. See
`docs/e2e-testing.md` for setup instructions. If browsers are not
installed, `make test` alone covers manifest validation, manifest helper
functions, and component-level fallback behaviour.

### What the e2e tests check

`web/tests/e2e/office-assets.spec.ts` verifies:

- Every `/assets/office/*.glb` HTTP request returns 200 (no missing files).
- No GLB requests are made to external hosts.
- All ten expected GLB filenames are requested when the page loads.
- The viewport `data-environment-preset` attribute is `"office"` by default.
- All ten default scene objects appear in `data-enabled-objects`.
