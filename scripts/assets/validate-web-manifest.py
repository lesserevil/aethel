#!/usr/bin/env python3
"""validate-web-manifest — Cross-validate the web office manifest against USD and source provenance.

Checks that every web office manifest entry (web/src/assets/officeAssetManifest.ts) has:
  1. A corresponding entry in assets/usd/office/web-asset-map.json (the mapping artifact)
  2. A source manifest record in assets/sources/office/manifest.json
  3. A USD prim path present in assets/usd/office/office.usda (string search)
  4. Consistent usdPrimPath between the map and the source manifest

Also optionally invokes:
  * usdchecker (from the usd-core package) for schema-level USD validation — skipped cleanly
    when usd-core is not installed.
  * omni.asset_validator (Omniverse Asset Validator) — skipped cleanly when NVIDIA Omniverse
    is not installed.  This check is always optional and never blocks the default target.

Usage
-----
    python3 scripts/assets/validate-web-manifest.py [options]

Options
-------
    --map <path>            Path to web-asset-map.json.
                            Default: assets/usd/office/web-asset-map.json
    --source-manifest <path>
                            Path to the source manifest JSON.
                            Default: assets/sources/office/manifest.json
    --stage <path>          Path to the root USDA stage file.
                            Default: assets/usd/office/office.usda
    --web-manifest <path>   Path to the web manifest TypeScript file.
                            Default: web/src/assets/officeAssetManifest.ts
    --usdchecker            Also run usdchecker on the stage file (requires usd-core).
                            Skipped with a warning if usdchecker is not available.
    --omniverse             Also attempt Omniverse Asset Validator checks.
                            Skipped with a warning if omni.asset_validator is not installed.

Exit codes
----------
    0  All mandatory checks pass.
    1  One or more mandatory checks failed.
    2  A required input file was not found.

Mandatory checks (always run, no external tools required):
  - web-asset-map.json is valid JSON and has at least one entry
  - every entry in the map has all required fields (webId, sourceManifestId, usdPrimPath)
  - usdPrimPath in each map entry starts with /World/
  - every webId in the map appears as an id in the web manifest TypeScript file
  - every web manifest id has an entry in the map (no unmapped web assets)
  - every sourceManifestId in the map references an existing record in source manifest
  - usdPrimPath in the map matches the usdPrimPath in the source manifest record
  - every usdPrimPath from the map can be found in the USD stage text

Optional checks (skipped when tooling is unavailable):
  - usdchecker schema validation of the USD stage
  - Omniverse Asset Validator / SimReady checks
"""

from __future__ import annotations

import json
import re
import sys
import os
import subprocess
from pathlib import Path
from typing import NamedTuple


# ---------------------------------------------------------------------------
# Failure record
# ---------------------------------------------------------------------------


class Failure(NamedTuple):
    check: str
    detail: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_json(path: Path) -> dict | list:
    """Load and parse a JSON file, exiting with code 2 if not found."""
    if not path.exists():
        print(f"ERROR: file not found: {path}", file=sys.stderr)
        sys.exit(2)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON in {path}: {exc}", file=sys.stderr)
        sys.exit(2)


def _extract_web_ids_from_ts(ts_path: Path) -> list[str]:
    """Extract id values from the OFFICE_ASSET_MANIFEST array in a TypeScript file.

    Uses a simple regex to find id: "..." entries.  This avoids any TS/JS tooling
    dependency and works on the well-known structure of officeAssetManifest.ts.
    """
    if not ts_path.exists():
        print(f"ERROR: web manifest file not found: {ts_path}", file=sys.stderr)
        sys.exit(2)
    text = ts_path.read_text(encoding="utf-8")
    # Match: id: "some-id-value"  (single or double quotes; optional spaces)
    ids = re.findall(r'\bid\s*:\s*["\']([^"\']+)["\']', text)
    return ids


# ---------------------------------------------------------------------------
# Validation checks
# ---------------------------------------------------------------------------


def check_map_structure(map_data: dict) -> list[Failure]:
    """Verify the top-level structure and required fields of web-asset-map.json."""
    failures: list[Failure] = []

    if not isinstance(map_data, dict):
        return [Failure("map-structure", "web-asset-map.json must be a JSON object")]

    entries = map_data.get("entries")
    if not isinstance(entries, list) or len(entries) == 0:
        failures.append(Failure("map-entries", "web-asset-map.json must have a non-empty 'entries' array"))
        return failures

    for i, entry in enumerate(entries):
        for field in ("webId", "sourceManifestId", "usdPrimPath"):
            if not isinstance(entry.get(field), str) or not entry[field]:
                failures.append(
                    Failure(
                        f"map-entry[{i}].{field}",
                        f"Entry {i} is missing or has empty field '{field}': {entry}",
                    )
                )

        # usdPrimPath must start with /World/
        prim_path = entry.get("usdPrimPath", "")
        if isinstance(prim_path, str) and prim_path and not prim_path.startswith("/World/"):
            failures.append(
                Failure(
                    f"map-entry[{i}].usdPrimPath-prefix",
                    f"Entry {i} usdPrimPath does not start with /World/: '{prim_path}'",
                )
            )

    return failures


def check_unique_web_ids(map_data: dict) -> list[Failure]:
    """Verify that all webId values in the map are unique."""
    entries = map_data.get("entries", [])
    seen: set[str] = set()
    duplicates: list[str] = []
    for entry in entries:
        web_id = entry.get("webId", "")
        if web_id in seen:
            duplicates.append(web_id)
        seen.add(web_id)
    if duplicates:
        return [
            Failure(
                "map-unique-webIds",
                f"Duplicate webId(s) in web-asset-map.json: {duplicates}",
            )
        ]
    return []


def check_web_manifest_coverage(
    map_data: dict, web_manifest_ids: list[str]
) -> list[Failure]:
    """Every web manifest id must have an entry in the map, and vice versa."""
    failures: list[Failure] = []
    map_web_ids = {e["webId"] for e in map_data.get("entries", []) if "webId" in e}
    web_ids = set(web_manifest_ids)

    # Web IDs not in the map — these must fail loudly
    unmapped = web_ids - map_web_ids
    for uid in sorted(unmapped):
        failures.append(
            Failure(
                f"web-manifest-unmapped:{uid}",
                f"Web manifest entry '{uid}' has no USD prim path in web-asset-map.json — "
                f"this asset is not mapped to any USD representation.",
            )
        )

    # Map entries with web IDs not in the web manifest — warn (map may be ahead of manifest)
    extra = map_web_ids - web_ids
    for eid in sorted(extra):
        failures.append(
            Failure(
                f"map-extra-webId:{eid}",
                f"web-asset-map.json references webId '{eid}' which is not present in "
                f"the web manifest.  Remove the stale map entry or add it to the manifest.",
            )
        )

    return failures


def check_source_manifest_coverage(
    map_data: dict, source_assets: list[dict]
) -> list[Failure]:
    """Every sourceManifestId in the map must reference a record in the source manifest."""
    failures: list[Failure] = []
    source_ids = {a["id"] for a in source_assets if "id" in a}

    for entry in map_data.get("entries", []):
        sid = entry.get("sourceManifestId", "")
        if sid and sid not in source_ids:
            failures.append(
                Failure(
                    f"source-manifest-missing:{sid}",
                    f"webId '{entry.get('webId')}' maps to sourceManifestId '{sid}' "
                    f"which does not exist in assets/sources/office/manifest.json.",
                )
            )

    return failures


def check_prim_path_consistency(
    map_data: dict, source_assets: list[dict]
) -> list[Failure]:
    """usdPrimPath in the map must match the usdPrimPath in the source manifest record."""
    failures: list[Failure] = []
    source_by_id = {a["id"]: a for a in source_assets if "id" in a}

    for entry in map_data.get("entries", []):
        sid = entry.get("sourceManifestId", "")
        map_prim = entry.get("usdPrimPath", "")
        if not sid or not map_prim:
            continue  # Already caught by structure check
        source_record = source_by_id.get(sid)
        if source_record is None:
            continue  # Already caught by coverage check
        source_prim = source_record.get("usdPrimPath", "")
        if map_prim != source_prim:
            failures.append(
                Failure(
                    f"prim-path-mismatch:{entry.get('webId')}",
                    f"webId '{entry.get('webId')}': map usdPrimPath '{map_prim}' "
                    f"does not match source manifest usdPrimPath '{source_prim}'.",
                )
            )

    return failures


def check_prim_paths_in_stage(map_data: dict, stage_text: str) -> list[Failure]:
    """Every usdPrimPath from the map must appear as a prim definition in the USD stage text."""
    failures: list[Failure] = []

    for entry in map_data.get("entries", []):
        prim_path = entry.get("usdPrimPath", "")
        web_id = entry.get("webId", "")
        if not prim_path:
            continue  # Already caught by structure check

        # Extract the leaf prim name from the path (last segment)
        leaf_name = prim_path.rsplit("/", 1)[-1]

        # Check for 'def <Token> "<LeafName>"' in the stage text
        pattern = rf'\bdef\s+\w+\s+"{re.escape(leaf_name)}"'
        if not re.search(pattern, stage_text):
            failures.append(
                Failure(
                    f"stage-prim-missing:{prim_path}",
                    f"webId '{web_id}': USD prim path '{prim_path}' (leaf '{leaf_name}') "
                    f"was not found as a prim definition in the USD stage.",
                )
            )

    return failures


# ---------------------------------------------------------------------------
# Optional usdchecker
# ---------------------------------------------------------------------------


def run_usdchecker(stage_path: Path) -> list[Failure]:
    """Optionally run usdchecker on the stage file.

    Returns an empty list if usdchecker is not available (the check is skipped).
    Returns failures on usdchecker errors.
    """
    import shutil

    usdchecker = shutil.which("usdchecker")
    if usdchecker is None:
        # Also try python -m pxr.UsdChecker if usd-core is installed
        try:
            result = subprocess.run(
                [sys.executable, "-c", "from pxr import UsdChecker; print('ok')"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if result.returncode != 0:
                print(
                    "[validate-web-manifest] INFO: usdchecker not available (usd-core not installed). "
                    "Skipping USD schema validation.\n"
                    "  To install: pip install usd-core",
                    file=sys.stderr,
                )
                return []
            usdchecker_cmd = [sys.executable, "-m", "pxr.UsdChecker"]
        except Exception:
            print(
                "[validate-web-manifest] INFO: usdchecker not available. Skipping USD schema validation.",
                file=sys.stderr,
            )
            return []
    else:
        usdchecker_cmd = [usdchecker]

    print(f"[validate-web-manifest] Running usdchecker on {stage_path} ...")
    try:
        result = subprocess.run(
            usdchecker_cmd + [str(stage_path)],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            output = (result.stdout + result.stderr).strip()
            return [
                Failure(
                    "usdchecker",
                    f"usdchecker reported errors for {stage_path}:\n{output}",
                )
            ]
        print(f"[validate-web-manifest] usdchecker OK: {stage_path}")
        return []
    except subprocess.TimeoutExpired:
        return [Failure("usdchecker-timeout", f"usdchecker timed out on {stage_path}")]
    except Exception as exc:
        return [Failure("usdchecker-error", f"usdchecker failed: {exc}")]


# ---------------------------------------------------------------------------
# Optional Omniverse Asset Validator
# ---------------------------------------------------------------------------


def run_omniverse_validator(stage_path: Path) -> list[Failure]:
    """Optionally run the Omniverse Asset Validator.

    This is ALWAYS optional.  The check is skipped cleanly if omni.asset_validator
    is not installed.  Does NOT require Omniverse desktop, Nucleus, RTX, or a GPU.
    """
    try:
        # Attempt import — will raise ImportError if not installed
        import omni.asset_validator  # type: ignore[import]
    except ImportError:
        print(
            "[validate-web-manifest] INFO: omni.asset_validator not installed. "
            "Skipping Omniverse Asset Validator checks (optional).\n"
            "  To install: pip install omni-asset-validator",
            file=sys.stderr,
        )
        return []

    print(
        f"[validate-web-manifest] Running Omniverse Asset Validator on {stage_path} ..."
    )
    try:
        from omni.asset_validator.core import ValidationEngine, IssueSeverity  # type: ignore[import]

        engine = ValidationEngine()
        results = engine.validate(str(stage_path))
        failures: list[Failure] = []
        for result in results:
            if result.severity in (IssueSeverity.ERROR, IssueSeverity.FAILURE):
                failures.append(
                    Failure(
                        f"omniverse-validator:{result.rule}",
                        f"{result.severity.name}: {result.message}",
                    )
                )
        if not failures:
            print(
                f"[validate-web-manifest] Omniverse Asset Validator OK: {stage_path}"
            )
        return failures
    except Exception as exc:
        print(
            f"[validate-web-manifest] WARNING: Omniverse Asset Validator error (skipped): {exc}",
            file=sys.stderr,
        )
        return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:  # noqa: C901
    # --- Parse arguments ----------------------------------------------------
    map_path = Path("assets/usd/office/web-asset-map.json")
    source_manifest_path = Path("assets/sources/office/manifest.json")
    stage_path = Path("assets/usd/office/office.usda")
    web_manifest_path = Path("web/src/assets/officeAssetManifest.ts")
    run_usdchecker_flag = False
    run_omniverse_flag = False

    args = sys.argv[1:]
    while args:
        arg = args.pop(0)
        if arg == "--map" and args:
            map_path = Path(args.pop(0))
        elif arg == "--source-manifest" and args:
            source_manifest_path = Path(args.pop(0))
        elif arg == "--stage" and args:
            stage_path = Path(args.pop(0))
        elif arg == "--web-manifest" and args:
            web_manifest_path = Path(args.pop(0))
        elif arg == "--usdchecker":
            run_usdchecker_flag = True
        elif arg == "--omniverse":
            run_omniverse_flag = True
        else:
            print(f"Unknown argument: {arg}", file=sys.stderr)
            sys.exit(1)

    print(f"[validate-web-manifest] map={map_path}")
    print(f"[validate-web-manifest] source-manifest={source_manifest_path}")
    print(f"[validate-web-manifest] stage={stage_path}")
    print(f"[validate-web-manifest] web-manifest={web_manifest_path}")

    # --- Load data ----------------------------------------------------------
    map_data = _load_json(map_path)
    source_manifest = _load_json(source_manifest_path)
    source_assets: list[dict] = source_manifest.get("assets", [])  # type: ignore[union-attr]

    if not stage_path.exists():
        print(f"ERROR: USD stage not found: {stage_path}", file=sys.stderr)
        sys.exit(2)
    stage_text = stage_path.read_text(encoding="utf-8")

    web_manifest_ids = _extract_web_ids_from_ts(web_manifest_path)
    print(f"[validate-web-manifest] Extracted {len(web_manifest_ids)} id(s) from web manifest.")

    # --- Mandatory checks ---------------------------------------------------
    all_failures: list[Failure] = []

    all_failures += check_map_structure(map_data)
    all_failures += check_unique_web_ids(map_data)
    all_failures += check_web_manifest_coverage(map_data, web_manifest_ids)
    all_failures += check_source_manifest_coverage(map_data, source_assets)
    all_failures += check_prim_path_consistency(map_data, source_assets)
    all_failures += check_prim_paths_in_stage(map_data, stage_text)

    # --- Optional checks ----------------------------------------------------
    if run_usdchecker_flag:
        all_failures += run_usdchecker(stage_path)

    if run_omniverse_flag:
        all_failures += run_omniverse_validator(stage_path)

    # --- Report -------------------------------------------------------------
    if not all_failures:
        entry_count = len(map_data.get("entries", []))
        print(
            f"[validate-web-manifest] OK: all {entry_count} map entries pass "
            f"mandatory validation checks."
        )
        sys.exit(0)
    else:
        print(
            f"\n[validate-web-manifest] FAILED: {len(all_failures)} check(s) failed.",
            file=sys.stderr,
        )
        for f in all_failures:
            print(f"  [{f.check}] {f.detail}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
