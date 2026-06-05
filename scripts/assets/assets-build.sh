#!/usr/bin/env bash
# assets-build — Convert source GLB/glTF assets to canonical OpenUSD.
#
# Usage:
#   scripts/assets/assets-build.sh [--dry-run]
#
#   --dry-run   Print what would run without executing Blender.
#
# This script converts raw source assets (GLB/glTF/FBX files placed
# under assets/sources/office/) into canonical OpenUSD files under
# assets/usd/office/.  Blender is used in non-interactive (headless)
# mode — it is never opened as a GUI application.
#
# Blender is an OPTIONAL tool at this stage.  If it is not installed
# the script prints actionable install instructions and exits non-zero
# only when source files are present but unconverted.  If no source
# files exist yet the script exits 0 with an informational message.
#
# GPU hardware, Omniverse desktop, Nucleus, or RTX rendering are NOT
# required by this script.
#
# Run from the repo root or via:
#   make assets-build

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

info "assets-build: source=$ASSETS_SOURCES_DIR  output=$ASSETS_USD_DIR"

# ── Verify manifest exists ────────────────────────────────────────────────────

MANIFEST="$ASSETS_SOURCES_DIR/manifest.json"
if [[ ! -f "$MANIFEST" ]]; then
    error "Source manifest not found: $MANIFEST"
    error "Set up the assets/ layout first — run TASK-17.1 or check the README."
    exit 1
fi
info "Manifest: $MANIFEST"

# ── Locate source files ───────────────────────────────────────────────────────

mapfile -d '' SOURCE_FILES < <(
    find "$ASSETS_SOURCES_DIR" \( -name "*.glb" -o -name "*.gltf" -o -name "*.fbx" \) \
        -print0 2>/dev/null | sort -z
)

if [[ ${#SOURCE_FILES[@]} -eq 0 ]]; then
    info "No source GLB/glTF/FBX files found in $ASSETS_SOURCES_DIR."
    info "Download the raw assets listed in $MANIFEST into that directory."
    info "Do NOT commit large raw archives; commit only processed USD outputs."
    info "assets-build: nothing to convert — exiting 0."
    exit 0
fi

info "Found ${#SOURCE_FILES[@]} source file(s)."

# ── Check Blender ─────────────────────────────────────────────────────────────

if ! check_tool "blender" \
    "https://www.blender.org/download/  or  brew install --cask blender"; then
    error "Blender is required to convert ${#SOURCE_FILES[@]} source file(s) to USD."
    error "Install Blender and re-run: make assets-build"
    error "No GPU or Omniverse license is needed for non-interactive conversion."
    exit 1
fi
info "blender: $(command -v blender)"

# ── Convert each source file ──────────────────────────────────────────────────

mkdir -p "$ASSETS_USD_DIR"

BLENDER_CONVERT_PY="$SCRIPT_DIR/blender_convert.py"
if [[ ! -f "$BLENDER_CONVERT_PY" ]]; then
    error "Blender conversion helper not found: $BLENDER_CONVERT_PY"
    error "This script is created as part of TASK-17.3 (Build the canonical USD stage)."
    exit 1
fi

FAIL_COUNT=0
for src in "${SOURCE_FILES[@]}"; do
    base="$(basename "$src")"
    stem="${base%.*}"
    out="$ASSETS_USD_DIR/${stem}.usda"
    info "Converting: $src -> $out"
    if [[ $DRY_RUN -eq 1 ]]; then
        info "  [dry-run] blender --background --python $BLENDER_CONVERT_PY -- $src $out"
    else
        if ! blender --background --python "$BLENDER_CONVERT_PY" -- "$src" "$out"; then
            warn "Conversion failed: $src"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi
done

if [[ $FAIL_COUNT -gt 0 ]]; then
    error "assets-build: $FAIL_COUNT file(s) failed to convert."
    exit 1
fi

info "assets-build: done — USD files are in $ASSETS_USD_DIR"
