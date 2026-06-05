"""Tests for scripts/physics/newton_smoke_harness.py.

All tests in this file run without Newton or a GPU installed.  They exercise:
  - USDA text parsing (_find_custom_data_block, parse_usda_metadata)
  - Scene building from USDA files (build_office_scene)
  - Scene validation (validate_scene)
  - Dry-run simulation (run_dry_run)
  - CLI logic (main) with --dry-run flag
  - Missing-dependency skip behaviour (_check_newton_available, main exit codes)

Run with:
    python3 -m pytest scripts/physics/test_newton_smoke_harness.py -v
or via the project quality gate:
    make physics-harness-test

Newton and NVIDIA Warp are NOT required for these tests to pass.
"""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest

# Make the module importable from the project root without installing it.
sys.path.insert(0, str(Path(__file__).parent))
from newton_smoke_harness import (  # type: ignore[import]
    ColliderBox,
    ColliderCylinder,
    DynamicBody,
    OfficeScene,
    _check_newton_available,
    _find_custom_data_block,
    _fmt_pos,
    build_office_scene,
    main,
    parse_usda_metadata,
    run_dry_run,
    validate_scene,
    _EXIT_FAIL,
    _EXIT_OK,
    _EXIT_SKIP,
)

# ── Paths ─────────────────────────────────────────────────────────────────────

_PROPS_DIR = (
    Path(__file__).parents[2] / "assets" / "usd" / "office" / "props"
)

# ── USDA fixtures ─────────────────────────────────────────────────────────────


def _desk_usda() -> str:
    return textwrap.dedent(
        """\
        #usda 1.0
        (doc = "test desk" metersPerUnit = 1.0 upAxis = "Y")
        def Xform "OfficeDeskRoot" (
            prepend apiSchemas = ["PhysicsCollisionAPI"]
            customData = {
                string physicsBodyType = "static"
                string physicsColliderType = "box"
                float3 physicsDimensions = (1.4, 0.75, 0.7)
                string semanticLabel = "large office desk"
                string assetId = "office-desk"
                string category = "furniture"
                bool agentSafe = false
                string[] affordances = ["work-surface"]
            }
        )
        {}
        """
    )


def _cup_usda() -> str:
    return textwrap.dedent(
        """\
        #usda 1.0
        (doc = "test cup" metersPerUnit = 1.0 upAxis = "Y")
        def Xform "OfficeCoffeeCupRoot" (
            prepend apiSchemas = ["PhysicsCollisionAPI", "PhysicsRigidBodyAPI"]
            customData = {
                string physicsBodyType = "dynamic"
                string physicsColliderType = "cylinder"
                float3 physicsDimensions = (0.08, 0.1, 0.08)
                string semanticLabel = "ceramic coffee cup"
                string assetId = "office-coffee-cup"
                string category = "clutter"
                bool agentSafe = true
                string[] affordances = ["containable", "pickup"]
                float physicsMassKg = 0.3
                float physicsFriction = 0.4
                float physicsRestitution = 0.1
            }
        )
        {}
        """
    )


# ── _find_custom_data_block ───────────────────────────────────────────────────


class TestFindCustomDataBlock:
    def test_finds_simple_block(self) -> None:
        text = 'customData = { string foo = "bar" }'
        block = _find_custom_data_block(text)
        assert block is not None
        assert "foo" in block

    def test_returns_none_when_absent(self) -> None:
        assert _find_custom_data_block('def Xform "Foo" {}') is None

    def test_handles_nested_braces(self) -> None:
        text = 'customData = { dict inner = { string x = "y" } string z = "w" }'
        block = _find_custom_data_block(text)
        assert block is not None
        assert "inner" in block
        assert "z" in block

    def test_returns_none_for_unclosed_brace(self) -> None:
        assert _find_custom_data_block("customData = { string foo = ") is None


# ── parse_usda_metadata ───────────────────────────────────────────────────────


class TestParseUsdaMetadata:
    def test_parses_api_schemas(self) -> None:
        meta = parse_usda_metadata(_desk_usda())
        assert "PhysicsCollisionAPI" in meta["apiSchemas"]

    def test_parses_string_field(self) -> None:
        meta = parse_usda_metadata(_desk_usda())
        assert meta["customData"]["physicsBodyType"] == "static"
        assert meta["customData"]["assetId"] == "office-desk"

    def test_parses_float_field(self) -> None:
        meta = parse_usda_metadata(_cup_usda())
        assert meta["customData"]["physicsMassKg"] == pytest.approx(0.3)

    def test_parses_bool_false(self) -> None:
        meta = parse_usda_metadata(_desk_usda())
        assert meta["customData"]["agentSafe"] is False

    def test_parses_bool_true(self) -> None:
        meta = parse_usda_metadata(_cup_usda())
        assert meta["customData"]["agentSafe"] is True

    def test_parses_float3(self) -> None:
        meta = parse_usda_metadata(_desk_usda())
        dims = meta["customData"]["physicsDimensions"]
        assert dims == pytest.approx((1.4, 0.75, 0.7))

    def test_parses_string_array(self) -> None:
        meta = parse_usda_metadata(_cup_usda())
        assert "pickup" in meta["customData"]["affordances"]

    def test_empty_file_returns_empty_dicts(self) -> None:
        meta = parse_usda_metadata("#usda 1.0\n")
        assert meta["customData"] == {}
        assert meta["apiSchemas"] == []

    def test_parses_friction_and_restitution(self) -> None:
        meta = parse_usda_metadata(_cup_usda())
        assert meta["customData"]["physicsFriction"] == pytest.approx(0.4)
        assert meta["customData"]["physicsRestitution"] == pytest.approx(0.1)


# ── build_office_scene with temp USDA files ───────────────────────────────────


class TestBuildOfficeScene:
    def _write(self, tmp_path: Path, name: str, content: str) -> None:
        (tmp_path / name).write_text(content, encoding="utf-8")

    def test_builds_scene_from_valid_files(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        assert len(scene.static_colliders) == 1
        assert len(scene.dynamic_bodies) == 1

    def test_desk_becomes_box_collider(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        desk = scene.static_colliders[0]
        assert isinstance(desk, ColliderBox)
        assert desk.width == pytest.approx(1.4)
        assert desk.height == pytest.approx(0.75)
        assert desk.depth == pytest.approx(0.7)

    def test_cup_becomes_cylinder_collider(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        cup = scene.dynamic_bodies[0]
        assert isinstance(cup.collider, ColliderCylinder)

    def test_cup_mass_is_set(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        assert scene.dynamic_bodies[0].mass_kg == pytest.approx(0.3)

    def test_cup_restitution_is_set(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        assert scene.dynamic_bodies[0].restitution == pytest.approx(0.1)

    def test_missing_desk_raises_runtime_error(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        with pytest.raises(RuntimeError, match="not found"):
            build_office_scene(tmp_path)

    def test_missing_cup_raises_runtime_error(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        with pytest.raises(RuntimeError, match="not found"):
            build_office_scene(tmp_path)

    def test_cup_placed_above_desk(self, tmp_path: Path) -> None:
        """Cup initial y-position should be above the desk surface (> 0.75 m)."""
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        scene = build_office_scene(tmp_path)
        cup = scene.dynamic_bodies[0]
        assert cup.position[1] > 0.75, (
            "Cup must start above the desk so it has room to fall in the simulation."
        )


# ── validate_scene ────────────────────────────────────────────────────────────


class TestValidateScene:
    def _minimal_scene(self) -> OfficeScene:
        """Return a minimal valid scene for testing."""
        desk = ColliderBox(asset_id="office-desk", width=1.4, height=0.75, depth=0.7)
        cup_collider = ColliderCylinder(
            asset_id="office-coffee-cup", radius=0.04, height=0.1
        )
        cup = DynamicBody(
            asset_id="office-coffee-cup",
            mass_kg=0.3,
            friction=0.4,
            restitution=0.1,
            collider=cup_collider,
            position=(0.0, 1.5, 0.0),
        )
        return OfficeScene(static_colliders=[desk], dynamic_bodies=[cup])

    def test_valid_scene_has_no_errors(self) -> None:
        scene = self._minimal_scene()
        assert validate_scene(scene) == []

    def test_empty_static_colliders_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.static_colliders = []
        errors = validate_scene(scene)
        assert any("static" in e.lower() for e in errors)

    def test_empty_dynamic_bodies_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.dynamic_bodies = []
        errors = validate_scene(scene)
        assert any("dynamic" in e.lower() for e in errors)

    def test_zero_mass_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.dynamic_bodies[0].mass_kg = 0.0
        errors = validate_scene(scene)
        assert any("mass" in e.lower() for e in errors)

    def test_negative_mass_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.dynamic_bodies[0].mass_kg = -1.0
        errors = validate_scene(scene)
        assert any("mass" in e.lower() for e in errors)

    def test_restitution_above_1_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.dynamic_bodies[0].restitution = 1.5
        errors = validate_scene(scene)
        assert any("restitution" in e.lower() for e in errors)

    def test_negative_friction_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.dynamic_bodies[0].friction = -0.1
        errors = validate_scene(scene)
        assert any("friction" in e.lower() for e in errors)

    def test_zero_box_dimension_is_an_error(self) -> None:
        scene = self._minimal_scene()
        scene.static_colliders[0] = ColliderBox(
            asset_id="office-desk", width=0.0, height=0.75, depth=0.7
        )
        errors = validate_scene(scene)
        assert any("dimension" in e.lower() or "non-positive" in e.lower() for e in errors)

    def test_zero_cylinder_radius_is_an_error(self) -> None:
        cup_collider = ColliderCylinder(
            asset_id="test-cyl", radius=0.0, height=0.1
        )
        scene = self._minimal_scene()
        scene.static_colliders[0] = cup_collider
        errors = validate_scene(scene)
        assert any("radius" in e.lower() or "non-positive" in e.lower() for e in errors)


# ── ColliderBox helpers ───────────────────────────────────────────────────────


class TestColliderBoxHalfExtents:
    def test_half_extents_are_half_the_dimensions(self) -> None:
        box = ColliderBox(asset_id="test", width=1.4, height=0.75, depth=0.7)
        he = box.half_extents
        assert he == pytest.approx((0.7, 0.375, 0.35))


# ── run_dry_run ───────────────────────────────────────────────────────────────


class TestRunDryRun:
    def _scene(self) -> OfficeScene:
        desk = ColliderBox(asset_id="office-desk", width=1.4, height=0.75, depth=0.7)
        cup_collider = ColliderCylinder(
            asset_id="office-coffee-cup", radius=0.04, height=0.1
        )
        cup = DynamicBody(
            asset_id="office-coffee-cup",
            mass_kg=0.3,
            friction=0.4,
            restitution=0.1,
            collider=cup_collider,
            position=(0.0, 1.5, 0.0),
        )
        return OfficeScene(static_colliders=[desk], dynamic_bodies=[cup])

    def test_returns_results_dict(self) -> None:
        results = run_dry_run(self._scene(), n_steps=60, dt=1.0 / 60.0)
        assert "steps_completed" in results
        assert "cup_fell" in results

    def test_cup_falls_in_dry_run(self) -> None:
        results = run_dry_run(self._scene(), n_steps=60, dt=1.0 / 60.0)
        assert results["cup_fell"] is True

    def test_cup_final_y_below_initial(self) -> None:
        results = run_dry_run(self._scene(), n_steps=60, dt=1.0 / 60.0)
        assert results["cup_final_pos"][1] < results["cup_initial_pos"][1]

    def test_desk_stays_static_in_dry_run(self) -> None:
        """The static desk must not move in dry-run mode."""
        results = run_dry_run(self._scene(), n_steps=60, dt=1.0 / 60.0)
        assert results["desk_initial_pos"] == pytest.approx(results["desk_final_pos"])

    def test_steps_completed_matches_input(self) -> None:
        results = run_dry_run(self._scene(), n_steps=10, dt=0.016)
        assert results["steps_completed"] == 10

    def test_mode_label_mentions_dry_run(self) -> None:
        results = run_dry_run(self._scene(), n_steps=10, dt=0.016)
        assert "dry-run" in results.get("mode", "").lower()

    def test_very_short_run_still_produces_non_zero_drop(self) -> None:
        """Even 5 steps at 60 Hz must produce a measurable drop."""
        results = run_dry_run(self._scene(), n_steps=5, dt=1.0 / 60.0)
        drop = results["cup_initial_pos"][1] - results["cup_final_pos"][1]
        assert drop > 0.0, "Analytic free-fall must always produce a positive drop."


# ── _check_newton_available ───────────────────────────────────────────────────


class TestCheckNewtonAvailable:
    def test_skip_when_warp_missing(self) -> None:
        """Simulate environment without Warp or Newton."""
        with patch.dict("sys.modules", {"warp": None, "newton": None}):
            ok, reason = _check_newton_available()
        assert ok is False
        assert "warp" in reason.lower() or "newton" in reason.lower()

    def test_reason_contains_install_hint(self) -> None:
        with patch.dict("sys.modules", {"warp": None, "newton": None}):
            _, reason = _check_newton_available()
        assert "pip install" in reason.lower() or "install" in reason.lower()

    @pytest.mark.skipif(
        sys.modules.get("newton") is not None,
        reason="Newton is installed — skip the 'missing Newton' path test.",
    )
    def test_skip_when_newton_missing_but_warp_present(self) -> None:
        """If Warp is installed but Newton is not, reason mentions Newton."""
        import types

        fake_warp = types.ModuleType("warp")
        with patch.dict("sys.modules", {"warp": fake_warp, "newton": None}):
            ok, reason = _check_newton_available()
        assert ok is False
        assert "newton" in reason.lower()


# ── main() exit codes via --dry-run ───────────────────────────────────────────


class TestMainDryRun:
    def _write(self, tmp_path: Path, name: str, content: str) -> None:
        (tmp_path / name).write_text(content, encoding="utf-8")

    def test_dry_run_exits_0_with_valid_props(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        code = main(
            ["--dry-run", "--props-dir", str(tmp_path), "--steps", "10"]
        )
        assert code == _EXIT_OK

    def test_dry_run_exits_1_when_desk_missing(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        code = main(["--dry-run", "--props-dir", str(tmp_path)])
        assert code == _EXIT_FAIL

    def test_dry_run_exits_1_when_cup_missing(self, tmp_path: Path) -> None:
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        code = main(["--dry-run", "--props-dir", str(tmp_path)])
        assert code == _EXIT_FAIL


# ── main() skip exit code when Newton unavailable ─────────────────────────────


class TestMainSkip:
    def _write(self, tmp_path: Path, name: str, content: str) -> None:
        (tmp_path / name).write_text(content, encoding="utf-8")

    def test_exits_2_when_newton_unavailable(self, tmp_path: Path) -> None:
        """Without --dry-run and without Newton, main() must return _EXIT_SKIP (2)."""
        self._write(tmp_path, "office-desk.usda", _desk_usda())
        self._write(tmp_path, "office-coffee-cup.usda", _cup_usda())
        with patch.dict("sys.modules", {"warp": None, "newton": None}):
            code = main(["--props-dir", str(tmp_path)])
        assert code == _EXIT_SKIP


# ── Integration: real USDA files ─────────────────────────────────────────────


class TestRealUsdaFiles:
    """Run dry-run against the actual office prop USDA files in the repo.

    These tests skip if the props directory is not present (e.g., in a
    partial checkout), but always run in CI where the full repo is present.
    """

    @pytest.mark.skipif(
        not _PROPS_DIR.is_dir(),
        reason=f"props directory not found: {_PROPS_DIR}",
    )
    def test_dry_run_passes_on_real_scene(self) -> None:
        code = main(
            [
                "--dry-run",
                "--props-dir",
                str(_PROPS_DIR),
                "--steps",
                "30",
            ]
        )
        assert code == _EXIT_OK, (
            "Dry-run smoke harness failed on the real office USD scene."
            " Check that assets/usd/office/props/office-desk.usda and"
            " office-coffee-cup.usda exist and have valid physics metadata."
        )

    @pytest.mark.skipif(
        not _PROPS_DIR.is_dir(),
        reason=f"props directory not found: {_PROPS_DIR}",
    )
    def test_real_scene_builds_expected_collider_types(self) -> None:
        scene = build_office_scene(_PROPS_DIR)
        # Desk must be a box collider.
        assert any(isinstance(c, ColliderBox) for c in scene.static_colliders), (
            "Expected office-desk to produce a ColliderBox from the real USDA file."
        )
        # Coffee cup must be a cylinder collider.
        cup_bodies = [
            b for b in scene.dynamic_bodies if b.asset_id == "office-coffee-cup"
        ]
        assert cup_bodies, "Expected office-coffee-cup to appear as a DynamicBody."
        assert isinstance(cup_bodies[0].collider, ColliderCylinder), (
            "Expected office-coffee-cup to produce a ColliderCylinder."
        )

    @pytest.mark.skipif(
        not _PROPS_DIR.is_dir(),
        reason=f"props directory not found: {_PROPS_DIR}",
    )
    def test_real_scene_validates_cleanly(self) -> None:
        scene = build_office_scene(_PROPS_DIR)
        errors = validate_scene(scene)
        assert errors == [], (
            "validate_scene() reported errors on the real office USD scene:\n"
            + "\n".join(f"  - {e}" for e in errors)
        )


# ── _fmt_pos helper ───────────────────────────────────────────────────────────


class TestFmtPos:
    def test_formats_three_floats(self) -> None:
        result = _fmt_pos((1.0, 2.5, 3.14159))
        assert result == "(1.0000, 2.5000, 3.1416)"

    def test_formats_zeros(self) -> None:
        result = _fmt_pos((0.0, 0.0, 0.0))
        assert result == "(0.0000, 0.0000, 0.0000)"
