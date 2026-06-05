#!/usr/bin/env bash
# assets-validate — Validate OpenUSD office assets.
#
# Usage:
#   scripts/assets/assets-validate.sh
#
# Validates all *.usda / *.usdc / *.usd files under assets/usd/office/
# using whichever USD tool is available:
#   1. usdchecker   (from the usd-core Python package — preferred)
#   2. Python pxr   (bundled with usd-core; used as a fallback open check)
#
# If no USD files exist yet the script exits 0 with an informational
# message — the build step (make assets-build) runs first.
#
# If no validation tool is available the script exits non-zero and
# prints actionable instructions.  GPU hardware, Omniverse desktop,
# Nucleus, or RTX rendering are NOT required.
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

VALIDATOR=""
if command -v usdchecker >/dev/null 2>&1; then
    VALIDATOR="usdchecker"
    info "Validator: usdchecker ($(command -v usdchecker))"
elif python3 -c "from pxr import Usd" >/dev/null 2>&1; then
    VALIDATOR="python_pxr"
    info "Validator: Python pxr ($(python3 -c 'import pxr; print(pxr.__file__)'))"
else
    error "No USD validation tool found."
    error ""
    error "To install usd-core (includes usdchecker — no GPU required):"
    error "  pip install usd-core"
    error ""
    error "Or build OpenUSD from source:"
    error "  https://github.com/PixarAnimationStudios/OpenUSD"
    error ""
    error "Optional richer validation (Omniverse Asset Validator) is documented in"
    error "  docs/asset-pipeline.md  under 'Optional validation tools'."
    exit 1
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
