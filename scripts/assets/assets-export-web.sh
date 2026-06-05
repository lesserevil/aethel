#!/usr/bin/env bash
# assets-export-web — Export canonical USD office prop assets to web GLB files
#                     and synchronise them into the web public directory.
#
# Usage:
#   scripts/assets/assets-export-web.sh [--dry-run]
#
#   --dry-run   Print what would run without invoking Blender or copying files.
#
# Two-step pipeline
# -----------------
#   Step 1 — EXPORT
#     For each prop USDA in assets/usd/office/props/, use Blender in
#     non-interactive (headless) mode to import the USD and export an optimised
#     GLB into assets/exports/web/office/<webId>.glb.  The mapping from prop
#     file to web asset name is derived from assets/usd/office/web-asset-map.json
#     via scripts/assets/build-export-map.py.
#
#   Step 2 — SYNC
#     Copy only the files that actually changed (content-based comparison via
#     cmp -s) from assets/exports/web/office/ to web/public/assets/office/.
#     This keeps git diff clean; unchanged files are never touched.
#
# If no prop USD files are found the script exits 0 with an informational
# message — run `make assets-build` first.
#
# REQUIRED tools
#   blender  — Blender 3.0+ for USD→GLB conversion.
#              Install: https://www.blender.org/download/
#                  or   brew install --cask blender    (macOS)
#                  or   sudo snap install blender --classic  (Linux)
#
# NOT required
#   GPU hardware, Omniverse desktop, Nucleus, or RTX rendering are NOT
#   required for headless GLB export.
#
# Run from the repo root or via:
#   make assets-export-web

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=scripts/assets/common.sh
source "$SCRIPT_DIR/common.sh"

cd "$REPO_ROOT"

DRY_RUN=0
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        *) error "Unknown argument: $arg"; exit 1 ;;
    esac
done

info "assets-export-web: props=$ASSETS_USD_DIR/props  exports=$ASSETS_EXPORTS_DIR  web=$WEB_PUBLIC_OFFICE_DIR"

# ── Build the prop→web export map ─────────────────────────────────────────────
# build-export-map.py reads web-asset-map.json + source manifest and outputs
# one TSV line per web asset: <propFile>\t<webId>\t<exportPath>\t<webPublicPath>

if ! command -v python3 >/dev/null 2>&1; then
    error "python3 is required to build the export map."
    error "Install Python 3 and re-run: make assets-export-web"
    exit 1
fi

BUILD_MAP_PY="$SCRIPT_DIR/build-export-map.py"
if [[ ! -f "$BUILD_MAP_PY" ]]; then
    error "Export-map builder not found: $BUILD_MAP_PY"
    exit 1
fi

# Collect the map into an array (one element per line from the TSV).
mapfile -t EXPORT_MAP_LINES < <(python3 "$BUILD_MAP_PY")

if [[ ${#EXPORT_MAP_LINES[@]} -eq 0 ]]; then
    info "No prop mappings found in web-asset-map.json."
    info "Ensure assets/usd/office/web-asset-map.json is populated."
    exit 0
fi

info "Found ${#EXPORT_MAP_LINES[@]} web asset(s) in the export map."

# ── Check whether any prop USD files actually exist ───────────────────────────

PROPS_WITH_FILE=0
for line in "${EXPORT_MAP_LINES[@]}"; do
    prop_file="$(echo "$line" | cut -f1)"
    if [[ -n "$prop_file" && -f "$prop_file" ]]; then
        PROPS_WITH_FILE=$((PROPS_WITH_FILE + 1))
    fi
done

if [[ $PROPS_WITH_FILE -eq 0 ]]; then
    info "No prop USD files found under $ASSETS_USD_DIR/props/."
    info "USD prop stubs are produced by: make assets-build"
    info "assets-export-web: nothing to export — run 'make assets-build' first."
    exit 0
fi

info "Found $PROPS_WITH_FILE prop USD file(s) to export."

# ── Require Blender (skip check in --dry-run mode) ───────────────────────────

BLENDER_EXPORT_PY="$SCRIPT_DIR/blender_export_glb.py"
if [[ ! -f "$BLENDER_EXPORT_PY" ]]; then
    error "Blender export helper not found: $BLENDER_EXPORT_PY"
    error "This file should exist at scripts/assets/blender_export_glb.py."
    exit 1
fi

if [[ $DRY_RUN -eq 0 ]]; then
    if ! check_tool "blender" \
        "https://www.blender.org/download/  or  brew install --cask blender  or  sudo snap install blender --classic"; then
        error "Blender is required for USD → GLB export."
        error ""
        error "Install Blender and re-run: make assets-export-web"
        error "No GPU, Omniverse license, or Nucleus server is needed for"
        error "non-interactive headless export."
        error ""
        error "See docs/asset-pipeline.md for full installation instructions."
        exit 1
    fi
    info "blender: $(command -v blender)"
else
    info "blender: [dry-run — skipping availability check]"
fi

# ── Step 1: Export each prop USD to assets/exports/web/office/ ────────────────

mkdir -p "$ASSETS_EXPORTS_DIR"

EXPORT_FAIL=0
EXPORT_OK=0

for line in "${EXPORT_MAP_LINES[@]}"; do
    prop_file="$(echo "$line" | cut -f1)"
    web_id="$(echo "$line"   | cut -f2)"
    export_path="$(echo "$line" | cut -f3)"

    if [[ -z "$prop_file" || ! -f "$prop_file" ]]; then
        info "  Skipping $web_id — prop file not found: ${prop_file:-<none>}"
        continue
    fi

    info "  Export: $prop_file -> $export_path"
    if [[ $DRY_RUN -eq 1 ]]; then
        info "    [dry-run] blender --background --python $BLENDER_EXPORT_PY -- $prop_file $export_path"
        EXPORT_OK=$((EXPORT_OK + 1))
    else
        if blender --background --python "$BLENDER_EXPORT_PY" -- "$prop_file" "$export_path"; then
            EXPORT_OK=$((EXPORT_OK + 1))
        else
            warn "Export failed: $prop_file"
            EXPORT_FAIL=$((EXPORT_FAIL + 1))
        fi
    fi
done

if [[ $EXPORT_FAIL -gt 0 ]]; then
    error "assets-export-web: $EXPORT_FAIL export(s) failed."
    exit 1
fi

info "assets-export-web: exported $EXPORT_OK file(s) to $ASSETS_EXPORTS_DIR"

# ── Step 2: Sync assets/exports/web/office/ → web/public/assets/office/ ───────
# Only copy files whose content differs from the destination.  This avoids
# timestamp-only churn in git.  cmp -s compares bytes, not timestamps.

mkdir -p "$WEB_PUBLIC_OFFICE_DIR"

SYNC_COUNT=0

for line in "${EXPORT_MAP_LINES[@]}"; do
    export_path="$(echo "$line"    | cut -f3)"
    web_public_path="$(echo "$line" | cut -f4)"

    if [[ ! -f "$export_path" ]]; then
        continue
    fi

    if [[ $DRY_RUN -eq 1 ]]; then
        info "  [dry-run] sync: $export_path -> $web_public_path"
        SYNC_COUNT=$((SYNC_COUNT + 1))
        continue
    fi

    if [[ ! -f "$web_public_path" ]] || ! cmp -s "$export_path" "$web_public_path"; then
        cp -f "$export_path" "$web_public_path"
        info "  Synced: $export_path -> $web_public_path"
        SYNC_COUNT=$((SYNC_COUNT + 1))
    else
        info "  Up-to-date: $web_public_path (content unchanged)"
    fi
done

info "assets-export-web: synced $SYNC_COUNT file(s) to $WEB_PUBLIC_OFFICE_DIR"
info "assets-export-web: complete."
