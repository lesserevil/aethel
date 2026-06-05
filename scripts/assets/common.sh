#!/usr/bin/env bash
# Asset pipeline — shared helpers.
#
# Source this file from the other scripts/assets/*.sh files.
# Do NOT execute directly.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Default paths — override via environment variables if needed.
ASSETS_SOURCES_DIR="${ASSETS_SOURCES_DIR:-assets/sources/office}"
ASSETS_USD_DIR="${ASSETS_USD_DIR:-assets/usd/office}"
ASSETS_EXPORTS_DIR="${ASSETS_EXPORTS_DIR:-assets/exports/web/office}"

info() { echo "[asset-pipeline] $*"; }
warn() { echo "[asset-pipeline] WARNING: $*" >&2; }
error() { echo "[asset-pipeline] ERROR: $*" >&2; }

# missing TOOL_NAME INSTALL_HINT
# Prints a formatted missing-tool message to stderr.
missing() {
    local tool="$1"
    local hint="$2"
    echo "[asset-pipeline] MISSING: $tool" >&2
    echo "  Install : $hint" >&2
}

# check_tool TOOL_NAME INSTALL_HINT
# Prints a missing-tool message if the tool is not on PATH.
# Returns 0 if found, 1 if missing.  Does NOT exit.
check_tool() {
    local tool="$1"
    local hint="$2"
    if ! command -v "$tool" >/dev/null 2>&1; then
        missing "$tool" "$hint"
        return 1
    fi
    return 0
}

# check_python_module MODULE_NAME INSTALL_HINT
# Returns 0 if Python can import the module, 1 if not.
check_python_module() {
    local module="$1"
    local hint="$2"
    if ! python3 -c "import $module" >/dev/null 2>&1; then
        missing "Python module '$module'" "$hint"
        return 1
    fi
    return 0
}
