#!/usr/bin/env python3
"""validate-usd.py — USD Physics metadata validator for office props.

Validates that each required office prop USDA file exists and contains the
required physics metadata fields (customData and apiSchemas).

Usage:
    python3 scripts/assets/validate-usd.py [--props-dir <path>]

Exit codes:
    0  All required props pass validation.
    1  One or more required props fail validation.
    2  Bad arguments or missing props directory.

Does NOT require OpenUSD Python bindings (pxr). Parses USDA text directly
using Python's standard library. See assets/usd/PHYSICS_METADATA.md for
the field reference.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

# ── Required props and their expected metadata ────────────────────────────────

# All props that must exist and pass validation.
# Values mirror web/src/assets/officeAssetManifest.ts from TASK-18.1.
REQUIRED_PROPS: list[dict[str, Any]] = [
    {
        "assetId": "office-desk",
        "filename": "office-desk.usda",
        "physicsBodyType": "static",
        "physicsColliderType": "box",
        "agentSafe": False,
        "affordances": ["work-surface"],
        "requiresMassKg": False,
    },
    {
        "assetId": "office-chair",
        "filename": "office-chair.usda",
        "physicsBodyType": "static",
        "physicsColliderType": "box",
        "agentSafe": False,
        "affordances": ["seatable"],
        "requiresMassKg": False,
    },
    {
        "assetId": "office-monitor",
        "filename": "office-monitor.usda",
        "physicsBodyType": "static",
        "physicsColliderType": "box",
        "agentSafe": False,
        "affordances": ["displayable"],
        "requiresMassKg": False,
    },
    {
        "assetId": "office-laptop",
        "filename": "office-laptop.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "box",
        "agentSafe": True,
        "affordances": ["input-device", "pickup"],
        "requiresMassKg": True,
    },
    {
        "assetId": "office-keyboard",
        "filename": "office-keyboard.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "box",
        "agentSafe": True,
        "affordances": ["input-device", "pickup"],
        "requiresMassKg": True,
    },
    {
        "assetId": "office-trash-can",
        "filename": "office-trash-can.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "cylinder",
        "agentSafe": True,
        "affordances": ["waste-container", "pickup"],
        "requiresMassKg": True,
    },
    {
        "assetId": "office-desk-lamp",
        "filename": "office-desk-lamp.usda",
        "physicsBodyType": "static",
        "physicsColliderType": "convexHull",
        "agentSafe": False,
        "affordances": ["light-source"],
        "requiresMassKg": False,
    },
    # Clutter / accessories (at least three required per task spec)
    {
        "assetId": "office-book-stack",
        "filename": "office-book-stack.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "box",
        "agentSafe": True,
        "affordances": ["pickup"],
        "requiresMassKg": True,
    },
    {
        "assetId": "office-coffee-cup",
        "filename": "office-coffee-cup.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "cylinder",
        "agentSafe": True,
        "affordances": ["containable", "pickup"],
        "requiresMassKg": True,
    },
    {
        "assetId": "office-notebook",
        "filename": "office-notebook.usda",
        "physicsBodyType": "dynamic",
        "physicsColliderType": "box",
        "agentSafe": True,
        "affordances": ["pickup"],
        "requiresMassKg": True,
    },
]

# Required fields in every prop's customData dictionary.
REQUIRED_CUSTOM_DATA_FIELDS = [
    "physicsBodyType",
    "physicsColliderType",
    "physicsDimensions",
    "semanticLabel",
    "assetId",
    "category",
    "agentSafe",
    "affordances",
]

# ── USDA text parser ─────────────────────────────────────────────────────────


def _find_custom_data_block(text: str) -> str | None:
    """Return the contents of the first 'customData = { ... }' block.

    Uses a simple brace-counting approach so nested braces are handled
    correctly. Returns None if no block is found.
    """
    marker = re.search(r"\bcustomData\s*=\s*\{", text)
    if not marker:
        return None

    start = marker.end() - 1  # position of the opening brace
    depth = 0
    i = start
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : i]  # contents between braces
        i += 1
    return None  # unclosed brace


def parse_usda_metadata(usda_text: str) -> dict[str, Any]:
    """Extract customData fields and apiSchemas from USDA file text.

    Returns a dict with keys:
        'customData': dict of field_name → value
        'apiSchemas': list of schema name strings
    """
    result: dict[str, Any] = {
        "customData": {},
        "apiSchemas": [],
    }

    # ── apiSchemas ────────────────────────────────────────────────────────
    api_match = re.search(
        r"prepend\s+apiSchemas\s*=\s*\[([^\]]*)\]", usda_text, re.DOTALL
    )
    if api_match:
        schemas_raw = api_match.group(1)
        result["apiSchemas"] = re.findall(r'"([^"]+)"', schemas_raw)

    # ── customData ────────────────────────────────────────────────────────
    cd_block = _find_custom_data_block(usda_text)
    if cd_block is None:
        return result

    cd: dict[str, Any] = {}

    # string foo = "bar"
    for m in re.finditer(r'\bstring\s+(\w+)\s*=\s*"([^"]*)"', cd_block):
        cd[m.group(1)] = m.group(2)

    # float foo = 1.5  or  float foo = 2
    for m in re.finditer(r"\bfloat\s+(\w+)\s*=\s*([\d.]+)", cd_block):
        cd[m.group(1)] = float(m.group(2))

    # bool foo = true|false
    for m in re.finditer(r"\bbool\s+(\w+)\s*=\s*(true|false)\b", cd_block):
        cd[m.group(1)] = m.group(2) == "true"

    # float3 foo = (1.4, 0.75, 0.7)
    for m in re.finditer(
        r"\bfloat3\s+(\w+)\s*=\s*\(([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\)",
        cd_block,
    ):
        cd[m.group(1)] = (
            float(m.group(2)),
            float(m.group(3)),
            float(m.group(4)),
        )

    # string[] foo = ["a", "b"]
    for m in re.finditer(
        r'\bstring\[\]\s+(\w+)\s*=\s*\[(.*?)\]', cd_block, re.DOTALL
    ):
        values = re.findall(r'"([^"]*)"', m.group(2))
        cd[m.group(1)] = values

    result["customData"] = cd
    return result


# ── Per-prop validation ───────────────────────────────────────────────────────


def validate_prop(prop_spec: dict[str, Any], props_dir: Path) -> list[str]:
    """Validate a single prop USDA file.

    Returns a list of error strings (empty list means the prop passes).
    """
    errors: list[str] = []
    asset_id = prop_spec["assetId"]
    filepath = props_dir / prop_spec["filename"]

    # ── File existence ────────────────────────────────────────────────────
    if not filepath.is_file():
        errors.append(
            f"{asset_id}: file not found: {filepath}\n"
            f"  Every required prop must have a USDA file in {props_dir}."
        )
        return errors  # Cannot validate further without a file

    usda_text = filepath.read_text(encoding="utf-8")
    metadata = parse_usda_metadata(usda_text)
    cd = metadata["customData"]
    api_schemas = metadata["apiSchemas"]

    # ── PhysicsCollisionAPI required on all props ─────────────────────────
    if "PhysicsCollisionAPI" not in api_schemas:
        errors.append(
            f"{asset_id}: missing 'PhysicsCollisionAPI' in prepend apiSchemas.\n"
            f"  Add it to mark this prim as a physics collider."
        )

    # ── PhysicsRigidBodyAPI required for dynamic props ────────────────────
    if prop_spec["physicsBodyType"] == "dynamic":
        if "PhysicsRigidBodyAPI" not in api_schemas:
            errors.append(
                f"{asset_id}: physicsBodyType is 'dynamic' but 'PhysicsRigidBodyAPI'"
                f" is missing from apiSchemas.\n"
                f"  Dynamic props must declare PhysicsRigidBodyAPI."
            )

    # ── Required customData fields ─────────────────────────────────────────
    for field in REQUIRED_CUSTOM_DATA_FIELDS:
        if field not in cd:
            errors.append(
                f"{asset_id}: missing required customData field '{field}'.\n"
                f"  See assets/usd/PHYSICS_METADATA.md for the field reference."
            )

    # ── physicsBodyType value check ───────────────────────────────────────
    if "physicsBodyType" in cd:
        valid_body_types = {"static", "kinematic", "dynamic"}
        if cd["physicsBodyType"] not in valid_body_types:
            errors.append(
                f"{asset_id}: invalid physicsBodyType '{cd['physicsBodyType']}'.\n"
                f"  Must be one of: {sorted(valid_body_types)}."
            )
        elif cd["physicsBodyType"] != prop_spec["physicsBodyType"]:
            errors.append(
                f"{asset_id}: physicsBodyType is '{cd['physicsBodyType']}'"
                f" but spec requires '{prop_spec['physicsBodyType']}'."
            )

    # ── physicsColliderType value check ───────────────────────────────────
    if "physicsColliderType" in cd:
        valid_collider_types = {"box", "cylinder", "convexHull", "trimesh", "none"}
        if cd["physicsColliderType"] not in valid_collider_types:
            errors.append(
                f"{asset_id}: invalid physicsColliderType '{cd['physicsColliderType']}'.\n"
                f"  Must be one of: {sorted(valid_collider_types)}."
            )
        elif cd["physicsColliderType"] != prop_spec["physicsColliderType"]:
            errors.append(
                f"{asset_id}: physicsColliderType is '{cd['physicsColliderType']}'"
                f" but spec requires '{prop_spec['physicsColliderType']}'."
            )

    # ── physicsDimensions must be a 3-tuple of positive floats ───────────
    if "physicsDimensions" in cd:
        dims = cd["physicsDimensions"]
        if not (isinstance(dims, tuple) and len(dims) == 3):
            errors.append(
                f"{asset_id}: physicsDimensions must be a float3 tuple (w, h, d)."
            )
        elif not all(isinstance(v, float) and v > 0 for v in dims):
            errors.append(
                f"{asset_id}: all physicsDimensions values must be positive floats,"
                f" got {dims}."
            )

    # ── agentSafe boolean check ───────────────────────────────────────────
    if "agentSafe" in cd:
        if not isinstance(cd["agentSafe"], bool):
            errors.append(
                f"{asset_id}: agentSafe must be a bool (true or false)."
            )
        elif cd["agentSafe"] != prop_spec["agentSafe"]:
            errors.append(
                f"{asset_id}: agentSafe is {cd['agentSafe']}"
                f" but spec requires {prop_spec['agentSafe']}."
            )

    # ── semanticLabel must be a non-empty string ──────────────────────────
    if "semanticLabel" in cd:
        if not isinstance(cd["semanticLabel"], str) or not cd["semanticLabel"].strip():
            errors.append(f"{asset_id}: semanticLabel must be a non-empty string.")

    # ── assetId must match the prop spec ─────────────────────────────────
    if "assetId" in cd:
        if cd["assetId"] != asset_id:
            errors.append(
                f"{asset_id}: assetId in customData is '{cd['assetId']}'"
                f" but should be '{asset_id}'."
            )

    # ── affordances must be a non-empty list ──────────────────────────────
    if "affordances" in cd:
        aff = cd["affordances"]
        if not isinstance(aff, list):
            errors.append(f"{asset_id}: affordances must be a string[] list.")
        elif len(aff) == 0:
            errors.append(f"{asset_id}: affordances list must not be empty.")
        else:
            # Check that all expected affordances are present
            for expected_aff in prop_spec["affordances"]:
                if expected_aff not in aff:
                    errors.append(
                        f"{asset_id}: affordances missing expected tag '{expected_aff}',"
                        f" got {aff}."
                    )

    # ── physicsMassKg required for dynamic props ──────────────────────────
    if prop_spec["requiresMassKg"]:
        if "physicsMassKg" not in cd:
            errors.append(
                f"{asset_id}: dynamic prop is missing required customData field"
                f" 'physicsMassKg'."
            )
        elif not isinstance(cd["physicsMassKg"], float) or cd["physicsMassKg"] <= 0:
            errors.append(
                f"{asset_id}: physicsMassKg must be a positive float,"
                f" got {cd.get('physicsMassKg')}."
            )

    return errors


# ── Main ─────────────────────────────────────────────────────────────────────


def main(argv: list[str] | None = None) -> int:
    """Validate all required office prop USDA files.

    Returns 0 on success, 1 on validation failures, 2 on argument errors.
    """
    parser = argparse.ArgumentParser(
        description="Validate USD Physics metadata for office props.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--props-dir",
        default="assets/usd/office/props",
        help="Path to the props directory (default: assets/usd/office/props)",
    )
    args = parser.parse_args(argv)

    props_dir = Path(args.props_dir)
    if not props_dir.is_dir():
        print(
            f"ERROR: props directory not found: {props_dir}\n"
            f"  Create assets/usd/office/props/ and add prop USDA files.\n"
            f"  See assets/usd/PHYSICS_METADATA.md for the expected structure.",
            file=sys.stderr,
        )
        return 2

    all_errors: list[str] = []
    for prop_spec in REQUIRED_PROPS:
        prop_errors = validate_prop(prop_spec, props_dir)
        all_errors.extend(prop_errors)

    if all_errors:
        print(
            f"FAIL: USD Physics metadata validation failed with"
            f" {len(all_errors)} error(s):\n",
            file=sys.stderr,
        )
        for error in all_errors:
            print(f"  ✗ {error}", file=sys.stderr)
        print(
            f"\nSee assets/usd/PHYSICS_METADATA.md for the field reference.",
            file=sys.stderr,
        )
        return 1

    prop_count = len(REQUIRED_PROPS)
    print(
        f"OK: USD Physics metadata validation passed"
        f" ({prop_count}/{prop_count} required props validated)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
