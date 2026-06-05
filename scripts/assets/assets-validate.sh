#!/usr/bin/env bash
# assets-validate — Validate OpenUSD office assets and web manifest mapping.
#
# Usage:
#   scripts/assets/assets-validate.sh
#
# Runs the following checks in order:
#   1. Structural stage validator  (pure Python, no usd-core required)
#      Checks prim hierarchy, metadata, lights, camera, and prop references.
#
#   2. Web manifest mapping validator  (pure Python, no external tools required)
#      Verifies every web office manifest entry has a USD prim path and source
#      manifest record.  Fails loudly on any unmapped web asset.
#
#   3. USD schema validation  (requires usd-core; skipped cleanly if absent)
#      Validates all *.usda / *.usdc / *.usd files under assets/usd/office/
#      using whichever USD tool is available:
#        a. usdchecker  (from the usd-core Python package — preferred)
#        b. Python pxr  (bundled with usd-core; used as a fallback open check)
#
# If no USD files exist yet check 3 exits 0 with an informational message.
# GPU hardware, Omniverse desktop, Nucleus, or RTX rendering are NOT required.
#
# Run from the repo root or via:
#   make assets-validate

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=scripts/assets/common.sh
source "$SCRIPT_DIR/common.sh"

cd "$REPO_ROOT"

info "assets-validate: dir=$ASSETS_USD_DIR"

# ── 1. Structural validation (no usd-core required) ──────────────────────────
# Run the pure-Python structural validator — checks prim hierarchy, stage
# metadata, lights, camera, and prop references without needing usd-core.

STAGE_VALIDATOR="$SCRIPT_DIR/validate-usd-stage.py"
if [[ -f "$STAGE_VALIDATOR" ]] && command -v python3 >/dev/null 2>&1; then
    info "Running structural stage validator: $STAGE_VALIDATOR"
    if ! python3 "$STAGE_VALIDATOR"; then
        error "Structural validation failed.  Fix office.usda and re-run."
        exit 1
    fi
else
    info "Skipping structural validator (python3 not found or script missing)."
fi

# ── 2. Web manifest mapping validation (no usd-core required) ─────────────────
# Verify every web office manifest entry has a USD prim path and source manifest
# record.  Fails loudly if any web asset has no USD prim path.

WEB_MANIFEST_VALIDATOR="$SCRIPT_DIR/validate-web-manifest.py"
if [[ -f "$WEB_MANIFEST_VALIDATOR" ]] && command -v python3 >/dev/null 2>&1; then
    info "Running web manifest mapping validator: $WEB_MANIFEST_VALIDATOR"
    if ! python3 "$WEB_MANIFEST_VALIDATOR"; then
        error "Web manifest mapping validation failed."
        error "Fix assets/usd/office/web-asset-map.json and re-run."
        exit 1
    fi
else
    info "Skipping web manifest validator (python3 not found or script missing)."
fi

# ── Locate USD files ──────────────────────────────────────────────────────────

mapfile -d '' USD_FILES < <(
    find "$ASSETS_USD_DIR" \( -name "*.usda" -o -name "*.usdc" -o -name "*.usd" \) \
        -print0 2>/dev/null | sort -z
)

if [[ ${#USD_FILES[@]} -eq 0 ]]; then
    info "No USD files found in $ASSETS_USD_DIR."
    info "USD files are produced by: make assets-build"
    info "At this stage the USD stage has not been built yet."
    info "assets-validate: nothing to validate — OK."
    exit 0
fi

info "Found ${#USD_FILES[@]} USD file(s) to validate."

# ── Choose validation tool ────────────────────────────────────────────────────
# USD schema validation is optional: it runs when usd-core or usdchecker is
# present, and is skipped cleanly when neither is available.  The mandatory
# structural and mapping checks (steps 1 and 2 above) always run regardless.

VALIDATOR=""
if command -v usdchecker >/dev/null 2>&1; then
    VALIDATOR="usdchecker"
    info "Validator: usdchecker ($(command -v usdchecker))"
elif python3 -c "from pxr import Usd" >/dev/null 2>&1; then
    VALIDATOR="python_pxr"
    info "Validator: Python pxr ($(python3 -c 'import pxr; print(pxr.__file__)'))"
else
    info "USD schema validation tool (usd-core / usdchecker) not found — skipping."
    info "The structural and web-manifest checks above already ran successfully."
    info ""
    info "To also run USD schema validation, install usd-core (no GPU required):"
    info "  pip install usd-core"
    info ""
    info "Optional richer validation (Omniverse Asset Validator) is documented in"
    info "  docs/asset-pipeline.md  under 'Optional validation tools'."
    info "assets-validate: mandatory checks passed (USD schema check skipped)."
    exit 0
fi

# ── Validate each file ────────────────────────────────────────────────────────

FAIL_COUNT=0
for f in "${USD_FILES[@]}"; do
    info "Checking: $f"
    case "$VALIDATOR" in
        usdchecker)
            if ! usdchecker "$f" 2>&1; then
                warn "usdchecker reported issues: $f"
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
            ;;
        python_pxr)
            if ! python3 - "$f" <<'PYEOF'
import sys
from pxr import Usd

path = sys.argv[1]
stage = Usd.Stage.Open(path)
if stage is None:
    print(f"ERROR: failed to open stage: {path}", file=sys.stderr)
    sys.exit(1)
prims = list(stage.Traverse())
print(f"  OK: {len(prims)} prim(s) in {path}")
PYEOF
            then
                warn "pxr validation failed: $f"
                FAIL_COUNT=$((FAIL_COUNT + 1))
            fi
            ;;
    esac
done

if [[ $FAIL_COUNT -gt 0 ]]; then
    error "assets-validate: $FAIL_COUNT file(s) failed validation."
    exit 1
fi

info "assets-validate: all ${#USD_FILES[@]} file(s) passed."
