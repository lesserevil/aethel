#!/usr/bin/env python3
"""Generate the prop-USD-to-web-GLB export map from web-asset-map.json.

Reads
-----
- ``assets/usd/office/web-asset-map.json``  — webId ↔ sourceManifestId ↔ usdPrimPath
- ``assets/sources/office/manifest.json``   — source provenance per assetId
- ``assets/usd/office/props/``              — scanned for .usda prop stubs

Writes to stdout
----------------
TSV lines, one per web asset::

    <propFile>\\t<webId>\\t<exportPath>\\t<webPublicPath>

``propFile`` is relative to the repository root, or the empty string ``""``
if no matching prop USDA was found (a warning is printed to stderr for that
entry but the script still exits 0 so the caller can decide how to handle
missing props).

Example output line::

    assets/usd/office/props/desk.usda\\toffice-desk\\tassets/exports/web/office/office-desk.glb\\tweb/public/assets/office/office-desk.glb

Usage
-----
Called by ``scripts/assets/assets-export-web.sh``::

    while IFS=$'\\t' read -r prop_file web_id export_path web_public_path; do
        ...
    done < <(python3 scripts/assets/build-export-map.py)

Exit codes
----------
0 — success (even when some prop files are missing; warnings go to stderr).
1 — a required input file is missing or JSON is malformed.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


# ── Helpers ────────────────────────────────────────────────────────────────────


def _camel_to_snake(name: str) -> str:
    """Convert camelCase / PascalCase to snake_case.

    Examples::

        "desk"        -> "desk"
        "deskChair"   -> "desk_chair"
        "monitorWide" -> "monitor_wide"
        "trashCan"    -> "trash_can"
    """
    return re.sub(r"([A-Z])", r"_\1", name).lstrip("_").lower()


def _load_prop_asset_ids(props_dir: Path) -> dict[str, str]:
    """Return ``{assetId: absolute_path_string}`` by scanning ``props/*.usda``.

    Reads the ``customData.aethel.assetId`` string from each stub.  Falls
    back to a camelCase→snake_case derivation of the *filename* when the
    field cannot be found (e.g. for programmatically generated stubs that
    omit the customData block).
    """
    mapping: dict[str, str] = {}
    for usda in sorted(props_dir.glob("*.usda")):
        text = usda.read_text(encoding="utf-8")
        m = re.search(r'string assetId\s*=\s*"([^"]+)"', text)
        if m:
            asset_id = m.group(1)
        else:
            # Derive assetId from filename: desk_chair.usda -> deskChair
            stem = usda.stem  # e.g. "desk_chair"
            parts = stem.split("_")
            asset_id = parts[0] + "".join(p.capitalize() for p in parts[1:])
        mapping[asset_id] = str(usda.resolve())
    return mapping


# ── Main ───────────────────────────────────────────────────────────────────────


def main() -> None:
    # Locate the repo root: this script lives at scripts/assets/build-export-map.py
    repo_root = Path(__file__).resolve().parent.parent.parent

    web_asset_map_path = repo_root / "assets/usd/office/web-asset-map.json"
    source_manifest_path = repo_root / "assets/sources/office/manifest.json"
    props_dir = repo_root / "assets/usd/office/props"
    exports_dir = repo_root / "assets/exports/web/office"
    web_public_dir = repo_root / "web/public/assets/office"

    # Validate required inputs.
    missing: list[str] = []
    for p in (web_asset_map_path, source_manifest_path):
        if not p.exists():
            missing.append(str(p.relative_to(repo_root)))
    if missing:
        for m in missing:
            print(f"ERROR: required file not found: {m}", file=sys.stderr)
        sys.exit(1)

    # Load inputs.
    try:
        web_asset_map: dict = json.loads(web_asset_map_path.read_text(encoding="utf-8"))
        source_manifest: dict = json.loads(source_manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"ERROR: JSON parse error: {exc}", file=sys.stderr)
        sys.exit(1)

    source_by_id: dict[str, dict] = {a["id"]: a for a in source_manifest.get("assets", [])}

    # Scan prop USDA files for assetId -> path mapping.
    prop_by_asset_id: dict[str, str] = {}
    if props_dir.exists():
        prop_by_asset_id = _load_prop_asset_ids(props_dir)

    # Build and emit the TSV export map.
    for entry in web_asset_map.get("entries", []):
        web_id: str = entry["webId"]
        source_id: str = entry["sourceManifestId"]

        # Resolve prop USD file path.
        prop_abs: str | None = prop_by_asset_id.get(source_id)
        if prop_abs is None:
            # Try snake_case fallback.
            snake = _camel_to_snake(source_id)
            candidate = props_dir / f"{snake}.usda"
            if candidate.exists():
                prop_abs = str(candidate.resolve())

        if prop_abs is None:
            print(
                f"WARNING: no prop USDA found for sourceManifestId={source_id!r} "
                f"(webId={web_id!r}); entry will have empty propFile",
                file=sys.stderr,
            )
            prop_rel = ""
        else:
            try:
                prop_rel = str(Path(prop_abs).relative_to(repo_root))
            except ValueError:
                prop_rel = prop_abs

        export_path = str((exports_dir / f"{web_id}.glb").relative_to(repo_root))
        web_public_path = str((web_public_dir / f"{web_id}.glb").relative_to(repo_root))

        print(f"{prop_rel}\t{web_id}\t{export_path}\t{web_public_path}")


if __name__ == "__main__":
    main()
