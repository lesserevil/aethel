#!/usr/bin/env bash
# assets-export-web — Export canonical USD office assets to web GLB files.
#
# Usage:
#   scripts/assets/assets-export-web.sh [--dry-run]
#
#   --dry-run   Print what would run without executing Blender.
#
# Reads *.usda / *.usdc / *.usd files from assets/usd/office/ and
# exports a GLB file per asset into assets/exports/web/office/.
# Blender is used in non-interactive (headless) mode — it is never
# opened as a GUI application.
#
# If no USD files exist yet the script exits 0 with an informational
# message — run make assets-build first.
#
# GPU hardware, Omniverse desktop, Nucleus, or RTX rendering are NOT
# required for headless GLB export.
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

info "assets-export-web: source=$ASSETS_USD_DIR  output=$ASSETS_EXPORTS_DIR"

# ── Locate USD files ──────────────────────────────────────────────────────────

mapfile -d '' USD_FILES < <(
    find "$ASSETS_USD_DIR" \( -name "*.usda" -o -name "*.usdc" -o -name "*.usd" \) \
        -print0 2>/dev/null | sort -z
)

if [[ ${#USD_FILES[@]} -eq 0 ]]; then
    info "No USD files found in $ASSETS_USD_DIR."
    info "USD files are produced by: make assets-build"
    info "assets-export-web: nothing to export — run 'make assets-build' first."
    exit 0
fi

info "Found ${#USD_FILES[@]} USD file(s) to export."

# ── Check Blender ─────────────────────────────────────────────────────────────

if ! check_tool "blender" \
    "https://www.blender.org/download/  or  brew install --cask blender"; then
    error "Blender is required for USD -> GLB export."
    error "Install Blender and re-run: make assets-export-web"
    error "No GPU or Omniverse license is needed for non-interactive GLB export."
    exit 1
fi
info "blender: $(command -v blender)"

# ── Check export helper ───────────────────────────────────────────────────────

BLENDER_EXPORT_PY="$SCRIPT_DIR/blender_export_glb.py"
if [[ ! -f "$BLENDER_EXPORT_PY" ]]; then
    error "Blender export helper not found: $BLENDER_EXPORT_PY"
    error "This script is created as part of TASK-17.5 (Export USD to web GLB)."
    exit 1
fi

# ── Export each file ──────────────────────────────────────────────────────────

mkdir -p "$ASSETS_EXPORTS_DIR"

FAIL_COUNT=0
for usd in "${USD_FILES[@]}"; do
    base="$(basename "$usd")"
    stem="${base%.*}"
    out="$ASSETS_EXPORTS_DIR/${stem}.glb"
    info "Exporting: $usd -> $out"
    if [[ $DRY_RUN -eq 1 ]]; then
        info "  [dry-run] blender --background --python $BLENDER_EXPORT_PY -- $usd $out"
    else
        if ! blender --background --python "$BLENDER_EXPORT_PY" -- "$usd" "$out"; then
            warn "Export failed: $usd"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi
done

if [[ $FAIL_COUNT -gt 0 ]]; then
    error "assets-export-web: $FAIL_COUNT file(s) failed to export."
    exit 1
fi

info "assets-export-web: done — GLB files are in $ASSETS_EXPORTS_DIR"
info "Copy them to web/public/assets/office/ to update the web runtime."
