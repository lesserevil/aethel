#!/usr/bin/env python3
"""validate-usd-stage — Structural validator for the Aethel office USD stage.

Checks that assets/usd/office/office.usda has the required prim structure,
stage-level metadata, lights, camera, and prop payloads.  Does NOT require
usd-core or any NVIDIA tooling — uses plain-text regex/string parsing so it
runs in any Python 3.8+ environment.

Usage
-----
    python3 scripts/assets/validate-usd-stage.py [--stage <path>]

Options
-------
    --stage <path>   Path to the root USDA file to validate.
                     Default: assets/usd/office/office.usda

Exit codes
----------
    0  All checks pass.
    1  One or more checks failed (details printed to stderr).
    2  The USDA file was not found.

This script is intentionally self-contained: it is called by
  make assets-validate
and also imported by the vitest test suite indirectly via the test that
verifies the *file itself* exists and the *office.usda* contains the
expected structural markers.
"""

import re
import sys
import os
from pathlib import Path
from typing import NamedTuple


# ---------------------------------------------------------------------------
# Required structural markers
# ---------------------------------------------------------------------------

# Required prim paths — we verify these appear as "def <name>" or
# "def <Type> <name>" in the
# USDA text of the root stage (not necessarily all in one file; child prims
# inside Xform scopes count).  We search for the *name* token after `def ...`.
REQUIRED_PRIM_NAMES: list[str] = [
    "World",
    "Office",
    "OfficeDeskRoot",
    "OfficeChairRoot",
    "OfficeDeskLampRoot",
    "OfficeMonitorRoot",
    "OfficeLaptopRoot",
    "OfficeKeyboardRoot",
    "OfficeTrashCanRoot",
    "OfficeBookStackRoot",
    "OfficeCoffeeCupRoot",
    "OfficeNotebookRoot",
    "Lights",
    "Cameras",
]

# Required stage-level metadata keys that must appear in the opening ( ... )
# block of the USDA file.
REQUIRED_STAGE_METADATA: dict[str, str] = {
    "defaultPrim": '"World"',
    "metersPerUnit": "1",
    "upAxis": '"Y"',
}

# Required prop payloads — each must appear as a `prepend payload` or payload
# value pointing at the corresponding prop file.
REQUIRED_PROP_REFS: list[str] = [
    "props/office-desk.usda",
    "props/office-chair.usda",
    "props/office-laptop.usda",
    "props/office-keyboard.usda",
    "props/office-monitor.usda",
    "props/office-trash-can.usda",
    "props/office-desk-lamp.usda",
    "props/office-coffee-cup.usda",
    "props/office-book-stack.usda",
    "props/office-notebook.usda",
]

# Required light prim names.
REQUIRED_LIGHT_NAMES: list[str] = [
    "AmbientDome",
    "KeyLight",
]

# Required camera prim name.
REQUIRED_CAMERA_NAME: str = "OfficeCamera"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


class Failure(NamedTuple):
    check: str
    detail: str


def _check_stage_metadata(text: str) -> list[Failure]:
    """Verify the stage-level ( ... ) metadata block."""
    # Extract the opening metadata block — it starts after '#usda 1.0' and ends
    # at the first ')' that closes the opening '('.
    header_match = re.search(r"#usda\s+1\.0\s*\(", text)
    if not header_match:
        return [Failure("stage-header", "File does not begin with '#usda 1.0 ('")]

    start = header_match.end()
    depth = 1
    idx = start
    while idx < len(text) and depth > 0:
        if text[idx] == "(":
            depth += 1
        elif text[idx] == ")":
            depth -= 1
        idx += 1
    metadata_block = text[start : idx - 1]

    failures: list[Failure] = []
    for key, expected_value in REQUIRED_STAGE_METADATA.items():
        pattern = rf"\b{re.escape(key)}\s*=\s*{re.escape(expected_value)}"
        if not re.search(pattern, metadata_block):
            failures.append(
                Failure(
                    f"stage-metadata:{key}",
                    f"Stage metadata missing or wrong: {key} = {expected_value}",
                )
            )
    return failures


def _check_prim_names(text: str) -> list[Failure]:
    """Verify that required prim name tokens appear in the file."""
    # Pattern: 'def "<Name>"' or 'def <TypeToken> "<Name>"'
    defined_names: set[str] = set(
        re.findall(r'\bdef(?:\s+\w+)?\s+"(\w+)"', text)
    )
    failures: list[Failure] = []
    for name in REQUIRED_PRIM_NAMES:
        if name not in defined_names:
            failures.append(
                Failure(f"prim:{name}", f"Required prim not found: def ... \"{name}\"")
            )
    return failures


def _check_prop_refs(text: str) -> list[Failure]:
    """Verify that required prop USDA references appear in the file."""
    failures: list[Failure] = []
    for ref in REQUIRED_PROP_REFS:
        if ref not in text:
            failures.append(
                Failure(f"prop-ref:{ref}", f"Required prop reference not found: {ref}")
            )
    return failures


def _check_lights(text: str) -> list[Failure]:
    """Verify that required light prims are present."""
    defined_names: set[str] = set(
        re.findall(r'\bdef(?:\s+\w+)?\s+"(\w+)"', text)
    )
    failures: list[Failure] = []
    for name in REQUIRED_LIGHT_NAMES:
        if name not in defined_names:
            failures.append(
                Failure(f"light:{name}", f"Required light prim not found: \"{name}\"")
            )
    return failures


def _check_camera(text: str) -> list[Failure]:
    """Verify that the required camera prim is present."""
    if f'def Camera "{REQUIRED_CAMERA_NAME}"' not in text:
        return [
            Failure(
                f"camera:{REQUIRED_CAMERA_NAME}",
                f'Required camera prim not found: def Camera "{REQUIRED_CAMERA_NAME}"',
            )
        ]
    return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def validate(stage_path: Path) -> list[Failure]:
    """Run all structural checks on the given USDA file.  Returns a list of
    Failure objects; an empty list means all checks passed."""
    if not stage_path.exists():
        print(f"ERROR: stage file not found: {stage_path}", file=sys.stderr)
        sys.exit(2)

    text = stage_path.read_text(encoding="utf-8")

    failures: list[Failure] = []
    failures += _check_stage_metadata(text)
    failures += _check_prim_names(text)
    failures += _check_prop_refs(text)
    failures += _check_lights(text)
    failures += _check_camera(text)
    return failures


def main() -> None:
    stage_path = Path("assets/usd/office/office.usda")

    args = sys.argv[1:]
    while args:
        arg = args.pop(0)
        if arg == "--stage" and args:
            stage_path = Path(args.pop(0))
        else:
            print(f"Unknown argument: {arg}", file=sys.stderr)
            sys.exit(1)

    failures = validate(stage_path)

    if not failures:
        print(f"[validate-usd-stage] OK: {stage_path} passed all structural checks.")
        sys.exit(0)
    else:
        print(
            f"[validate-usd-stage] FAILED: {len(failures)} check(s) failed for {stage_path}",
            file=sys.stderr,
        )
        for f in failures:
            print(f"  [{f.check}] {f.detail}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
