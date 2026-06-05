"""Blender non-interactive USD → GLB export helper.

Called by assets-export-web.sh as::

    blender --background --python scripts/assets/blender_export_glb.py \\
        -- <usd_path> <glb_path>

Imports the USD file into Blender using its built-in USD importer (no
extra add-ons required), then exports the scene as a binary GLB file.
No GUI is opened.

Requirements
------------
- Blender 3.0 or later.  The USD importer and glTF/GLB exporter are
  bundled with Blender — no additional installation is required.
- GPU, Omniverse, Nucleus, and RTX rendering are NOT required.

Exit codes
----------
0 — export succeeded.
1 — argument error, file not found, or Blender operator failure.

Notes
-----
- Run via ``make assets-export-web`` rather than invoking Blender directly
  so that the Makefile supplies the correct ``--background`` flag and the
  shell script provides error-handling around the exit code.
- This script is written for Blender's embedded Python interpreter.  It
  imports ``bpy`` which is only available inside Blender, not from the
  system Python.
"""

from __future__ import annotations

import os
import sys


def _parse_args() -> tuple[str, str]:
    """Return (usd_path, glb_path) from the command-line after ``--``."""
    try:
        sep = sys.argv.index("--")
    except ValueError:
        print(
            "ERROR: Missing '--' separator.\n"
            "Usage: blender --background --python blender_export_glb.py "
            "-- <usd_path> <glb_path>",
            file=sys.stderr,
        )
        sys.exit(1)

    args = sys.argv[sep + 1 :]
    if len(args) < 2:
        print(
            f"ERROR: Expected <usd_path> <glb_path>, got: {args}",
            file=sys.stderr,
        )
        sys.exit(1)

    return os.path.abspath(args[0]), os.path.abspath(args[1])


def main() -> None:
    try:
        import bpy  # noqa: PLC0415  # only available inside Blender
    except ImportError:
        print(
            "ERROR: 'bpy' not found.  This script must run inside the Blender "
            "Python interpreter:\n"
            "  blender --background --python blender_export_glb.py -- <usd> <glb>",
            file=sys.stderr,
        )
        sys.exit(1)

    usd_path, glb_path = _parse_args()

    if not os.path.isfile(usd_path):
        print(f"ERROR: USD file not found: {usd_path}", file=sys.stderr)
        sys.exit(1)

    # Ensure the output directory exists.
    glb_dir = os.path.dirname(glb_path)
    if glb_dir:
        os.makedirs(glb_dir, exist_ok=True)

    print(f"[blender_export_glb] Import : {usd_path}")

    # Reset to an empty scene so we don't inherit default cube / camera.
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Import USD via Blender's built-in USD importer.
    result = bpy.ops.wm.usd_import(filepath=usd_path)
    if "FINISHED" not in result:
        print(
            f"ERROR: USD import failed for: {usd_path}  (result={result})",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"[blender_export_glb] Export : {glb_path}")

    # Export the scene as a binary GLB file.
    result = bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_apply=True,  # bake modifiers into mesh data
    )
    if "FINISHED" not in result:
        print(
            f"ERROR: GLB export failed for: {glb_path}  (result={result})",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"[blender_export_glb] Done   : {glb_path}")


if __name__ == "__main__":
    main()
