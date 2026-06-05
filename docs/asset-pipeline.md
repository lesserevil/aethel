# Asset Pipeline

This document explains how to build, validate, and export the Aethel office
scene assets using the Make targets defined in the repo root `Makefile`.

## Overview

Aethel uses two representations of every scene asset:

- **Canonical USD** — OpenUSD files under `assets/usd/office/`. These are the
  authoritative source of truth for geometry, materials, hierarchy, and
  provenance metadata. They feed physics simulations, AI agent perception, and
  higher-fidelity rendering pipelines.

- **Web GLB** — Optimized GLB files under `assets/exports/web/office/`. These
  are derived exports from the USD stage, suitable for streaming to a browser
  via the Three.js / React Three Fiber renderer. The browser never loads USD
  directly.

```mermaid
flowchart LR
    src["assets/sources/office/\n(source manifest + raw downloads)"]
    usd["assets/usd/office/\n(canonical USD stage)"]
    exp["assets/exports/web/office/\n(pipeline-generated GLBs)"]
    web["web/public/assets/office/\n(web runtime GLBs)"]

    src -- "make assets-build" --> usd
    usd -- "make assets-validate" --> usd
    usd -- "make assets-export-web" --> exp
    exp -- "copy to web/public/" --> web
    src -- "make assets-populate-runtime" --> exp
```

## Make Targets

### `make assets-build`

Converts raw source assets (GLB/glTF/FBX files placed under
`assets/sources/office/`) into canonical OpenUSD files under
`assets/usd/office/`.

**Script:** `scripts/assets/assets-build.sh`

**Required tools:** Blender (see [Installing Blender](#installing-blender))

**Behavior when tools or source files are missing:**

- If no source files are present the script exits successfully with an
  informational message — no tool check failure occurs.
- If source files are present but Blender is not installed the script prints
  an install hint and exits non-zero.

```bash
make assets-build           # convert all source files
```

### `make assets-validate`

Validates all USD files in `assets/usd/office/` for parse and schema
correctness.

**Script:** `scripts/assets/assets-validate.sh`

**Required tools:** `usd-core` Python package (see
[Installing usd-core](#installing-usd-core))

**Behavior when tools or USD files are missing:**

- If no USD files exist yet the script exits successfully — the build step
  has not run yet and there is nothing to validate.
- If USD files exist but no validation tool is installed the script prints
  install instructions and exits non-zero.

```bash
make assets-validate        # validate all USD files
```

### `make assets-export-web`

Exports each canonical USD office prop to a web-ready GLB file and then
synchronises those files into `web/public/assets/office/`.

**Script:** `scripts/assets/assets-export-web.sh`

**Helper scripts:**
- `scripts/assets/build-export-map.py` — reads `web-asset-map.json` and the
  source manifest to produce the deterministic prop→webId mapping.
- `scripts/assets/blender_export_glb.py` — Blender Python helper that imports
  a USD file and exports it as a binary GLB.

**Required tools:** Blender 3.0+ (see [Installing Blender](#installing-blender))

**Two-step pipeline:**

```
Step 1 — EXPORT
  For each prop USD in assets/usd/office/props/,
  Blender imports the USD and exports an optimised GLB to
  assets/exports/web/office/<webId>.glb.

Step 2 — SYNC
  Content-based copy (cmp -s) from
  assets/exports/web/office/ → web/public/assets/office/.
  Files with identical byte content are never touched,
  keeping git diff clean.
```

The mapping from USD prop file to web asset name is derived from
`assets/usd/office/web-asset-map.json` so the output filenames always match
what `web/src/assets/officeAssetManifest.ts` expects.

**Behavior when tools or USD files are missing:**

- If no prop USD files exist the script exits successfully with an
  informational message — run `make assets-build` first.
- If prop USD files exist but Blender is not installed the script prints a
  clear install hint and exits non-zero.  The web public files are **not**
  modified when the export step fails.

```bash
make assets-export-web      # export all USD props to GLB + sync to web
```

### `make assets-populate-runtime`

Populates the checked-in MVP office runtime GLBs without requiring Blender.
This is the current seed-asset path for the default web scene while the full
USD-to-GLB export pipeline matures.

**Script:** `scripts/assets/populate-office-runtime-glbs.mjs`

**Required tools:** Node.js and `unzip`. No GPU, Omniverse, or Blender is
required.

**Inputs:**

- `/tmp/aethel-assets/kenney_furniture-kit.zip` by default, or
  `KENNEY_FURNITURE_KIT_ZIP=/path/to/kenney_furniture-kit.zip`.

**Outputs:**

- `assets/exports/web/office/*.glb`
- `web/public/assets/office/*.glb`

The script normalizes the selected Kenney GLBs to the runtime manifest
dimensions and generates deterministic local mesh GLBs for the coffee cup and
notebook.

```bash
make assets-populate-runtime
```

### `--dry-run` flag

`assets-build` and `assets-export-web` accept a `--dry-run` flag that prints
what would run without executing Blender or copying any files.  `--dry-run`
skips the Blender availability check so it works even when Blender is not
installed.

```bash
scripts/assets/assets-build.sh --dry-run
scripts/assets/assets-export-web.sh --dry-run
```

---

## Optional Tools

None of these tools are mandatory for the web MVP (`make run`). They are only
needed when rebuilding or validating USD assets.

GPU hardware, Omniverse desktop, Nucleus server, and RTX rendering are **not**
required by any of these targets.

### Installing Blender

Blender is used in non-interactive (headless) mode for GLB ↔ USD conversion.
It is never opened as a GUI application by the pipeline scripts.

| Platform | Command |
|---|---|
| macOS | `brew install --cask blender` |
| Linux (snap) | `sudo snap install blender --classic` |
| All platforms | Download from <https://www.blender.org/download/> |

Verify the install:

```bash
blender --version
```

### Installing usd-core

`usd-core` is a pure Python package that bundles `usdchecker` and the `pxr`
Python API. It does **not** require a GPU, Omniverse account, or NVIDIA
hardware.

```bash
pip install usd-core
```

Verify the install:

```bash
usdchecker --help
python3 -c "from pxr import Usd; print('pxr OK')"
```

### Optional: Omniverse Asset Validator

The Omniverse Asset Validator provides richer USD quality checks including
SimReady profile validation. It requires an Omniverse installation and is
documented separately at:

<https://docs.omniverse.nvidia.com/kit/docs/asset-validator/latest/source/python/docs/index.html>

This validator is **not** required by `make assets-validate` — it is an
optional enhancement. The mandatory `make assets-validate` path uses only
`usd-core`.

---

## Directory Layout

```text
assets/
  sources/
    office/
      manifest.json        # machine-readable source catalog (TASK-17.1)
      manifest.schema.json # JSON Schema for manifest validation
      README.md            # how to add new assets
      licenses/            # optional license text snapshots
  usd/
    office/                # canonical USD files (built by make assets-build)
      office.usda          # root stage with all prop references
      props/               # per-prop USD stubs (one file per asset)
      web-asset-map.json   # webId ↔ sourceManifestId ↔ usdPrimPath
  exports/
    web/
      office/              # web GLB files (built by make assets-export-web)

web/
  public/
    assets/
      office/              # web runtime GLBs served by Vite / the browser
                           # synced from exports/ by make assets-export-web

scripts/
  assets/
    common.sh              # shared helper functions (not executable directly)
    assets-build.sh        # backing script for make assets-build
    assets-validate.sh     # backing script for make assets-validate
    assets-export-web.sh   # backing script for make assets-export-web
    populate-office-runtime-glbs.mjs  # seed runtime GLBs for the MVP scene
    blender_export_glb.py  # Blender Python helper: USD → GLB (requires bpy)
    build-export-map.py    # generates prop→webId TSV mapping from JSON inputs
```

Do not commit large raw asset downloads. Source manifests and license files
are small and committed. Processed USD outputs are committed when their size
is acceptable for normal git history.

---

## Adding a New Asset

1. Confirm the license is CC0 or public domain.
2. Add a row to `docs/office-asset-sources.md`.
3. Add a matching entry to `assets/sources/office/manifest.json` following the
   existing schema.
4. Run `make test` to verify the drift-detection test passes.
5. Download the raw source file and place it in `assets/sources/office/`.
6. Run `make assets-build` to convert it to USD.
7. Run `make assets-validate` to check the new USD file.
8. Run `make assets-export-web` to generate the GLB for web use.
9. Run `make assets-export-web` — this copies the exported GLB to
   `web/public/assets/office/` automatically via the sync step.
10. Do **not** commit the raw downloaded archive.

---

## Troubleshooting

### `MISSING: blender`

Blender is not on your `PATH`. Install it using the instructions under
[Installing Blender](#installing-blender), then re-run the Make target.

If you only want to see what the export **would** do (without actually running
Blender), use the dry-run flag:

```bash
scripts/assets/assets-export-web.sh --dry-run
```

### `Blender is required for USD → GLB export`

`make assets-export-web` found USD prop files that need to be exported, but
Blender is not installed.  The web runtime GLB files in
`web/public/assets/office/` are **not** modified until Blender is available
and a successful export completes.  Install Blender and re-run the target.

### `MISSING: Python module 'pxr'` or `No USD validation tool found`

`usd-core` is not installed. Run:

```bash
pip install usd-core
```

then re-run `make assets-validate`.

### `No USD files found in assets/usd/office/`

The USD stage has not been built yet. Run `make assets-build` first. If no
source files are present under `assets/sources/office/`, download the raw
assets listed in `assets/sources/office/manifest.json`.

### Blender opens a GUI window

The pipeline scripts always pass `--background` to Blender, which suppresses
the GUI. If a window appears, the script is not being invoked through the
Make target. Run `make assets-build` (or the full script path) instead of
invoking Blender directly.
