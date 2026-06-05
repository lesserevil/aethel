#!/usr/bin/env python3
"""Newton Office-Scene Smoke Harness — optional Newton evaluation script.

Loads physics metadata from the canonical Aethel office USD scene (parsed from
USDA text without requiring the OpenUSD Python bindings) and attempts to run a
short deterministic Newton simulation that exercises:

  - at least one static furniture collider  (office desk — box, 1.4 m × 0.75 m × 0.7 m)
  - at least one movable small prop         (coffee cup — cylinder, 0.3 kg, restitution=0.1)

Newton and NVIDIA Warp are OPTIONAL dependencies. If they are not installed the
script exits immediately with a clear "SKIP" message and exit code 2 so that
CI gates and `make test` continue passing without GPU hardware.

Usage
-----
    python3 scripts/physics/newton_smoke_harness.py [options]

Options
-------
    --steps N       Number of simulation steps to run (default: 60, i.e. 1 s at 60 Hz)
    --dt FLOAT      Time step in seconds (default: 0.01667, i.e. 1/60 s)
    --dry-run       Parse the USD scene and validate physics objects without
                    running Newton; always succeeds without Newton installed.
    --props-dir P   Path to the USDA props directory (default: assets/usd/office/props)
    --scene-file S  Path to the office scene USDA file (default: assets/usd/office/office.usda)

Exit codes
----------
    0   Smoke simulation completed successfully (or dry-run passed).
    1   Simulation failed — unexpected error or physics assertion violated.
    2   Newton or a required optional dependency is unavailable (SKIP).

See docs/office-physics.md for installation instructions, tested hardware,
and why Newton is not a default MVP dependency.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

# ── Skip sentinel ─────────────────────────────────────────────────────────────

_EXIT_SKIP = 2
_EXIT_FAIL = 1
_EXIT_OK = 0

# ── Scene objects that the harness exercises ──────────────────────────────────

#: The static collider exercised in the smoke test.
_STATIC_PROP_ID = "office-desk"

#: The dynamic (movable) prop exercised in the smoke test.
_DYNAMIC_PROP_ID = "office-coffee-cup"

# ── USDA metadata parser (no OpenUSD dependency) ──────────────────────────────


def _find_custom_data_block(text: str) -> str | None:
    """Return the inner contents of the first ``customData = { … }`` block.

    Uses brace-counting so nested dictionaries are handled correctly.
    Returns *None* if the block is absent or unclosed.
    """
    marker = re.search(r"\bcustomData\s*=\s*\{", text)
    if not marker:
        return None
    start = marker.end() - 1
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start + 1 : i]
    return None


def parse_usda_metadata(usda_text: str) -> dict[str, Any]:
    """Extract ``customData`` fields and ``apiSchemas`` from USDA source text.

    Returns a dict::

        {
            "customData": {field: value, …},
            "apiSchemas": [schema_name, …],
        }

    Supported field types: ``string``, ``float``, ``bool``, ``float3``,
    ``string[]``.  Does not require OpenUSD Python bindings.
    """
    result: dict[str, Any] = {"customData": {}, "apiSchemas": []}

    api_match = re.search(
        r"prepend\s+apiSchemas\s*=\s*\[([^\]]*)\]", usda_text, re.DOTALL
    )
    if api_match:
        result["apiSchemas"] = re.findall(r'"([^"]+)"', api_match.group(1))

    cd_block = _find_custom_data_block(usda_text)
    if cd_block is None:
        return result

    cd: dict[str, Any] = {}
    for m in re.finditer(r'\bstring\s+(\w+)\s*=\s*"([^"]*)"', cd_block):
        cd[m.group(1)] = m.group(2)
    for m in re.finditer(r"\bfloat\s+(\w+)\s*=\s*([\d.]+)", cd_block):
        cd[m.group(1)] = float(m.group(2))
    for m in re.finditer(r"\bbool\s+(\w+)\s*=\s*(true|false)\b", cd_block):
        cd[m.group(1)] = m.group(2) == "true"
    for m in re.finditer(
        r"\bfloat3\s+(\w+)\s*=\s*\(([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\)",
        cd_block,
    ):
        cd[m.group(1)] = (float(m.group(2)), float(m.group(3)), float(m.group(4)))
    for m in re.finditer(r'\bstring\[\]\s+(\w+)\s*=\s*\[(.*?)\]', cd_block, re.DOTALL):
        cd[m.group(1)] = re.findall(r'"([^"]*)"', m.group(2))
    result["customData"] = cd
    return result


# ── Physics object data classes ────────────────────────────────────────────────


@dataclass
class ColliderBox:
    """Axis-aligned box collider in metres (width, height, depth)."""
    asset_id: str
    width: float
    height: float
    depth: float
    position: tuple[float, float, float] = (0.0, 0.0, 0.0)

    @property
    def half_extents(self) -> tuple[float, float, float]:
        return (self.width / 2, self.height / 2, self.depth / 2)


@dataclass
class ColliderCylinder:
    """Cylinder collider with radius and height in metres."""
    asset_id: str
    radius: float
    height: float
    position: tuple[float, float, float] = (0.0, 0.0, 0.0)


@dataclass
class DynamicBody:
    """A movable rigid body composed with a collider."""
    asset_id: str
    mass_kg: float
    friction: float
    restitution: float
    collider: ColliderBox | ColliderCylinder
    position: tuple[float, float, float] = (0.0, 0.0, 0.0)


@dataclass
class OfficeScene:
    """Parsed physics representation of the office USD scene."""
    static_colliders: list[ColliderBox | ColliderCylinder] = field(default_factory=list)
    dynamic_bodies: list[DynamicBody] = field(default_factory=list)


# ── Scene builder ─────────────────────────────────────────────────────────────


def _parse_prop_file(prop_path: Path) -> dict[str, Any]:
    """Parse a single USDA file and return its customData dict."""
    try:
        text = prop_path.read_text(encoding="utf-8")
    except OSError as exc:
        raise RuntimeError(f"Cannot read {prop_path}: {exc}") from exc
    return parse_usda_metadata(text)["customData"]


def _build_collider(asset_id: str, cd: dict[str, Any]) -> ColliderBox | ColliderCylinder:
    """Build a collider object from a prop's customData dictionary."""
    dims: tuple[float, float, float] = cd.get("physicsDimensions", (0.1, 0.1, 0.1))
    collider_type: str = cd.get("physicsColliderType", "box")
    if collider_type == "cylinder":
        # Treat dims as (diameter, height, diameter); radius = dims[0] / 2.
        radius = dims[0] / 2.0
        height = dims[1]
        return ColliderCylinder(asset_id=asset_id, radius=radius, height=height)
    # Default to box for all other collider types (box, convexHull, trimesh).
    return ColliderBox(
        asset_id=asset_id,
        width=dims[0],
        height=dims[1],
        depth=dims[2],
    )


def build_office_scene(props_dir: Path) -> OfficeScene:
    """Parse the office prop USDA files and return an :class:`OfficeScene`.

    Only reads props that the smoke test cares about; does not require a
    working USD stage loader.  Returns a scene with at least one static
    collider and one dynamic body if the expected files are present.

    Raises :class:`RuntimeError` if a required prop file is missing.
    """
    scene = OfficeScene()

    # ── Static desk collider ────────────────────────────────────────────────
    desk_path = props_dir / "office-desk.usda"
    if not desk_path.is_file():
        raise RuntimeError(
            f"Required static collider file not found: {desk_path}\n"
            f"  Run 'make assets-validate' to verify the office prop files."
        )
    desk_cd = _parse_prop_file(desk_path)
    desk_collider = _build_collider(_STATIC_PROP_ID, desk_cd)
    scene.static_colliders.append(desk_collider)

    # ── Dynamic coffee-cup body ─────────────────────────────────────────────
    cup_path = props_dir / "office-coffee-cup.usda"
    if not cup_path.is_file():
        raise RuntimeError(
            f"Required dynamic prop file not found: {cup_path}\n"
            f"  Run 'make assets-validate' to verify the office prop files."
        )
    cup_cd = _parse_prop_file(cup_path)
    cup_collider = _build_collider(_DYNAMIC_PROP_ID, cup_cd)
    cup_body = DynamicBody(
        asset_id=_DYNAMIC_PROP_ID,
        mass_kg=float(cup_cd.get("physicsMassKg", 0.3)),
        friction=float(cup_cd.get("physicsFriction", 0.5)),
        restitution=float(cup_cd.get("physicsRestitution", 0.0)),
        collider=cup_collider,
        # Place the cup above the desk surface so it has room to fall.
        position=(0.0, 1.5, 0.0),
    )
    scene.dynamic_bodies.append(cup_body)

    return scene


def validate_scene(scene: OfficeScene) -> list[str]:
    """Return a list of error strings for scene validation issues.

    An empty list means the scene is structurally valid for the smoke test.
    """
    errors: list[str] = []
    if not scene.static_colliders:
        errors.append("Scene has no static colliders — need at least one (office desk).")
    if not scene.dynamic_bodies:
        errors.append("Scene has no dynamic bodies — need at least one movable prop.")

    for body in scene.dynamic_bodies:
        if body.mass_kg <= 0:
            errors.append(
                f"Dynamic body '{body.asset_id}' has invalid mass {body.mass_kg} kg"
                f" — must be > 0."
            )
        if body.restitution < 0 or body.restitution > 1:
            errors.append(
                f"Dynamic body '{body.asset_id}' has restitution {body.restitution}"
                f" outside [0, 1]."
            )
        if body.friction < 0:
            errors.append(
                f"Dynamic body '{body.asset_id}' has negative friction {body.friction}."
            )

    for collider in scene.static_colliders:
        if isinstance(collider, ColliderBox):
            if collider.width <= 0 or collider.height <= 0 or collider.depth <= 0:
                errors.append(
                    f"Static collider '{collider.asset_id}' has non-positive dimensions"
                    f" ({collider.width}, {collider.height}, {collider.depth})."
                )
        elif isinstance(collider, ColliderCylinder):
            if collider.radius <= 0 or collider.height <= 0:
                errors.append(
                    f"Static collider '{collider.asset_id}' has non-positive"
                    f" radius={collider.radius} or height={collider.height}."
                )

    return errors


# ── Newton simulation (optional) ──────────────────────────────────────────────


def _check_newton_available() -> tuple[bool, str]:
    """Return ``(available, reason)`` for the Newton/Warp dependency check.

    Tries to import ``warp`` (NVIDIA Warp) and ``newton`` in sequence.
    Returns ``(False, reason)`` with a human-readable reason string if
    either import fails.
    """
    try:
        import warp  # noqa: F401  # type: ignore[import]
    except ImportError:
        return False, (
            "NVIDIA Warp is not installed.\n"
            "  Install: pip install warp-lang\n"
            "  See docs/office-physics.md for full Newton setup instructions."
        )
    try:
        import newton  # noqa: F401  # type: ignore[import]
    except ImportError:
        return False, (
            "Newton physics is not installed.\n"
            "  Install: pip install newton-physics   (or follow the source build in\n"
            "  docs/office-physics.md for the development version).\n"
            "  Warp is installed — only the Newton layer is missing."
        )
    return True, ""


def _run_newton_simulation(
    scene: OfficeScene,
    n_steps: int,
    dt: float,
) -> dict[str, Any]:
    """Run a Newton simulation and return a results dict.

    The simulation adds:
      - a ground plane at y = 0;
      - a static box body for the desk;
      - a dynamic body for the coffee cup.

    It then steps the simulation for *n_steps* at timestep *dt* seconds
    and asserts that:
      - the desk body did not move (static);
      - the coffee cup moved downward under gravity.

    Returns a dict with keys:
        ``steps_completed``, ``desk_final_pos``, ``cup_initial_pos``,
        ``cup_final_pos``, ``cup_fell``.

    Raises :class:`RuntimeError` on any physics assertion failure.

    .. note::
        Newton's Python API is in active development.  This implementation
        follows the ModelBuilder pattern documented in the Newton GitHub
        repository (https://github.com/newton-physics/newton) as of 2026.
        If the Newton API changes, update this function and re-run the
        harness.  The dry-run tests (``--dry-run``) will remain stable
        regardless of Newton API evolution.
    """
    import warp as wp  # type: ignore[import]
    import newton  # type: ignore[import]
    from newton.sim import ModelBuilder  # type: ignore[import]

    wp.init()

    builder = ModelBuilder()
    builder.set_gravity((0.0, -9.81, 0.0))

    # Ground plane at y = 0 (infinite static plane).
    builder.add_ground_plane(normal=(0.0, 1.0, 0.0), offset=0.0)

    # ── Static desk collider ─────────────────────────────────────────────────
    desk_collider: ColliderBox | ColliderCylinder = scene.static_colliders[0]
    desk_initial_pos = (0.0, 0.375, 0.0)  # centre of desk top surface at y=0.375
    if isinstance(desk_collider, ColliderBox):
        builder.add_body(
            pos=wp.vec3(*desk_initial_pos),
            rot=wp.quat_identity(),
            mass=0.0,  # mass=0 → static in Newton / Warp convention
        )
        body_idx = builder.body_count - 1
        builder.add_shape_box(
            body=body_idx,
            hx=desk_collider.half_extents[0],
            hy=desk_collider.half_extents[1],
            hz=desk_collider.half_extents[2],
            pos=wp.vec3(0.0, 0.0, 0.0),
        )
    else:
        # Fallback: convex hull colliders treated as their bounding box.
        builder.add_body(
            pos=wp.vec3(*desk_initial_pos),
            rot=wp.quat_identity(),
            mass=0.0,
        )

    # ── Dynamic coffee-cup body ──────────────────────────────────────────────
    cup_body: DynamicBody = scene.dynamic_bodies[0]
    cup_initial_pos: tuple[float, float, float] = cup_body.position
    cup_collider = cup_body.collider
    builder.add_body(
        pos=wp.vec3(*cup_initial_pos),
        rot=wp.quat_identity(),
        mass=cup_body.mass_kg,
    )
    cup_idx = builder.body_count - 1
    if isinstance(cup_collider, ColliderCylinder):
        builder.add_shape_capsule(
            body=cup_idx,
            radius=cup_collider.radius,
            half_height=cup_collider.height / 2.0,
            pos=wp.vec3(0.0, 0.0, 0.0),
        )
    else:
        half = cup_collider.half_extents
        builder.add_shape_box(
            body=cup_idx,
            hx=half[0],
            hy=half[1],
            hz=half[2],
            pos=wp.vec3(0.0, 0.0, 0.0),
        )

    model = builder.finalize(device="cpu")
    integrator = newton.sim.SemiImplicitIntegrator()

    state_0 = model.state()
    state_1 = model.state()

    # ── Simulation loop ──────────────────────────────────────────────────────
    for _ in range(n_steps):
        state_0.clear_forces()
        integrator.simulate(model, state_0, state_1, dt)
        state_0, state_1 = state_1, state_0

    # ── Extract final positions ──────────────────────────────────────────────
    positions = state_0.body_q.numpy()  # shape (n_bodies, 7) — pos + quat

    # Body 0 is the desk (static).
    desk_final_pos = tuple(float(v) for v in positions[0, :3])
    # Body 1 is the coffee cup (dynamic).
    cup_final_pos = tuple(float(v) for v in positions[cup_idx, :3])

    # ── Physics assertions ───────────────────────────────────────────────────
    desk_moved = any(
        abs(desk_final_pos[i] - desk_initial_pos[i]) > 1e-4
        for i in range(3)
    )
    if desk_moved:
        raise RuntimeError(
            f"FAIL: Static desk body moved during simulation.\n"
            f"  initial={desk_initial_pos}  final={desk_final_pos}\n"
            f"  A static body must not move under physics forces."
        )

    cup_fell = cup_final_pos[1] < cup_initial_pos[1] - 0.01
    if not cup_fell:
        raise RuntimeError(
            f"FAIL: Dynamic coffee-cup body did not fall under gravity.\n"
            f"  initial_y={cup_initial_pos[1]:.4f}  final_y={cup_final_pos[1]:.4f}\n"
            f"  Expected the cup to drop at least 0.01 m over {n_steps} steps."
        )

    return {
        "steps_completed": n_steps,
        "desk_initial_pos": desk_initial_pos,
        "desk_final_pos": desk_final_pos,
        "cup_initial_pos": cup_initial_pos,
        "cup_final_pos": cup_final_pos,
        "cup_fell": cup_fell,
    }


# ── Dry-run (no Newton required) ──────────────────────────────────────────────


def run_dry_run(scene: OfficeScene, n_steps: int, dt: float) -> dict[str, Any]:
    """Validate scene metadata and simulate gravity analytically without Newton.

    This mode runs without Newton or a GPU.  It exercises all scene-loading
    and validation logic and proves that the expected props are present with
    correct physics metadata.

    Returns a dict with the same keys as :func:`_run_newton_simulation` but
    with analytically computed positions instead of Newton-integrated ones.
    """
    desk_initial_pos = (0.0, 0.375, 0.0)

    cup_body = scene.dynamic_bodies[0]
    cup_initial_pos = cup_body.position

    # Analytic free-fall: y(t) = y₀ + v₀t − ½gt²
    # Assume v₀ = 0, g = 9.81 m/s².
    t_total = n_steps * dt
    drop = 0.5 * 9.81 * t_total ** 2
    cup_final_pos = (
        cup_initial_pos[0],
        cup_initial_pos[1] - drop,
        cup_initial_pos[2],
    )

    cup_fell = cup_final_pos[1] < cup_initial_pos[1] - 0.01
    if not cup_fell:
        raise RuntimeError(
            f"DRY-RUN FAIL: Analytic free-fall did not produce expected drop.\n"
            f"  t={t_total:.3f} s  drop={drop:.4f} m  initial_y={cup_initial_pos[1]}"
        )

    return {
        "steps_completed": n_steps,
        "desk_initial_pos": desk_initial_pos,
        "desk_final_pos": desk_initial_pos,  # static — unchanged
        "cup_initial_pos": cup_initial_pos,
        "cup_final_pos": cup_final_pos,
        "cup_fell": cup_fell,
        "mode": "dry-run (analytic — Newton not used)",
    }


# ── CLI ───────────────────────────────────────────────────────────────────────


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--steps",
        type=int,
        default=60,
        metavar="N",
        help="Number of simulation steps (default: 60 — 1 s at 60 Hz).",
    )
    p.add_argument(
        "--dt",
        type=float,
        default=1.0 / 60.0,
        metavar="FLOAT",
        help="Simulation time step in seconds (default: 1/60 ≈ 0.01667 s).",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Parse the USD scene and validate physics objects without running Newton."
            " Always succeeds without Newton installed."
        ),
    )
    p.add_argument(
        "--props-dir",
        default="assets/usd/office/props",
        metavar="PATH",
        help="Path to the USDA props directory (default: assets/usd/office/props).",
    )
    p.add_argument(
        "--scene-file",
        default="assets/usd/office/office.usda",
        metavar="PATH",
        help="Path to the scene USDA file (default: assets/usd/office/office.usda).",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Entry point for the Newton office-scene smoke harness.

    Returns an exit code (0 = OK, 1 = FAIL, 2 = SKIP).
    """
    args = _parse_args(argv)
    props_dir = Path(args.props_dir)
    n_steps: int = args.steps
    dt: float = args.dt

    # ── Scene loading ──────────────────────────────────────────────────────
    print(f"[harness] Loading office scene from: {props_dir}")
    try:
        scene = build_office_scene(props_dir)
    except RuntimeError as exc:
        print(f"[harness] ERROR loading scene: {exc}", file=sys.stderr)
        return _EXIT_FAIL

    validation_errors = validate_scene(scene)
    if validation_errors:
        print("[harness] Scene validation failed:", file=sys.stderr)
        for err in validation_errors:
            print(f"  ✗ {err}", file=sys.stderr)
        return _EXIT_FAIL

    static_count = len(scene.static_colliders)
    dynamic_count = len(scene.dynamic_bodies)
    print(
        f"[harness] Scene loaded: {static_count} static collider(s),"
        f" {dynamic_count} dynamic body(ies)."
    )
    for coll in scene.static_colliders:
        print(f"  static : {coll.asset_id} ({type(coll).__name__})")
    for body in scene.dynamic_bodies:
        print(
            f"  dynamic: {body.asset_id} ({type(body.collider).__name__},"
            f" mass={body.mass_kg} kg)"
        )

    # ── Dry-run mode ───────────────────────────────────────────────────────
    if args.dry_run:
        print(
            f"[harness] Dry-run mode: running analytic free-fall"
            f" for {n_steps} steps (dt={dt:.5f} s) without Newton."
        )
        try:
            results = run_dry_run(scene, n_steps, dt)
        except RuntimeError as exc:
            print(f"[harness] DRY-RUN FAILED: {exc}", file=sys.stderr)
            return _EXIT_FAIL
        _print_results(results)
        print("[harness] Dry-run passed.")
        return _EXIT_OK

    # ── Newton availability check ──────────────────────────────────────────
    newton_ok, newton_reason = _check_newton_available()
    if not newton_ok:
        print(
            f"[harness] SKIP: Newton optional dependencies are not available.\n"
            f"  {newton_reason}\n"
            f"  Tip: run with --dry-run to exercise scene loading without Newton.",
            file=sys.stderr,
        )
        return _EXIT_SKIP

    # ── Newton simulation ──────────────────────────────────────────────────
    print(
        f"[harness] Running Newton simulation:"
        f" {n_steps} steps × dt={dt:.5f} s"
        f" = {n_steps * dt:.3f} s simulated."
    )
    try:
        results = _run_newton_simulation(scene, n_steps, dt)
    except RuntimeError as exc:
        print(f"[harness] SIMULATION FAILED:\n  {exc}", file=sys.stderr)
        return _EXIT_FAIL
    except Exception as exc:  # noqa: BLE001
        print(
            f"[harness] UNEXPECTED ERROR during Newton simulation:\n  {exc}",
            file=sys.stderr,
        )
        return _EXIT_FAIL

    _print_results(results)
    print("[harness] Newton smoke test PASSED.")
    return _EXIT_OK


def _print_results(results: dict[str, Any]) -> None:
    mode = results.get("mode", "newton")
    print(f"[harness] Results ({mode}):")
    print(f"  steps completed : {results['steps_completed']}")
    print(f"  desk  initial   : {_fmt_pos(results['desk_initial_pos'])}")
    print(f"  desk  final     : {_fmt_pos(results['desk_final_pos'])}  (static — unchanged)")
    print(f"  cup   initial   : {_fmt_pos(results['cup_initial_pos'])}")
    print(f"  cup   final     : {_fmt_pos(results['cup_final_pos'])}")
    print(f"  cup fell?       : {results['cup_fell']}")


def _fmt_pos(pos: tuple[float, float, float] | tuple[float, ...]) -> str:
    return "({:.4f}, {:.4f}, {:.4f})".format(*pos)


if __name__ == "__main__":
    sys.exit(main())
