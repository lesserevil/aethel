"""Tests for scripts/assets/validate-usd.py.

These tests exercise:
  - USDA text parsing (parse_usda_metadata, _find_custom_data_block)
  - Per-prop validation (validate_prop)
  - End-to-end validation of the real USDA files in assets/usd/office/props/
  - Integration: main() exit codes

Run with:
    python3 -m pytest scripts/assets/test_validate_usd.py -v
or via:
    make assets-validate-test
"""

from __future__ import annotations

import sys
import textwrap
from io import StringIO
from pathlib import Path

import pytest

# Make the script importable without installing it.
sys.path.insert(0, str(Path(__file__).parent))
from validate_usd import (  # type: ignore[import]
    _find_custom_data_block,
    parse_usda_metadata,
    validate_prop,
    main,
    REQUIRED_PROPS,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

PROPS_DIR = Path(__file__).parents[2] / "assets" / "usd" / "office" / "props"


def _minimal_static_usda(
    asset_id: str = "office-test-prop",
    body_type: str = "static",
    collider_type: str = "box",
    dims: str = "(1.0, 1.0, 1.0)",
    category: str = "furniture",
    agent_safe: str = "false",
    affordances: str = '["work-surface"]',
    extra_fields: str = "",
    api_schemas: str = '["PhysicsCollisionAPI"]',
) -> str:
    return textwrap.dedent(
        f"""\
        #usda 1.0
        (
            doc = "Test prop"
            metersPerUnit = 1.0
            upAxis = "Y"
        )

        def Xform "TestPropRoot" (
            prepend apiSchemas = {api_schemas}
            customData = {{
                string physicsBodyType = "{body_type}"
                string physicsColliderType = "{collider_type}"
                float3 physicsDimensions = {dims}
                string semanticLabel = "a test prop"
                string assetId = "{asset_id}"
                string category = "{category}"
                bool agentSafe = {agent_safe}
                string[] affordances = {affordances}
                {extra_fields}
            }}
        )
        {{
        }}
        """
    )


def _minimal_dynamic_usda(
    asset_id: str = "office-test-dynamic",
    collider_type: str = "box",
    mass: float = 1.0,
    friction: float | None = 0.5,
    restitution: float | None = None,
    affordances: str = '["pickup"]',
) -> str:
    optional_fields = f"float physicsMassKg = {mass}\n"
    if friction is not None:
        optional_fields += f"                float physicsFriction = {friction}\n"
    if restitution is not None:
        optional_fields += f"                float physicsRestitution = {restitution}\n"

    return _minimal_static_usda(
        asset_id=asset_id,
        body_type="dynamic",
        collider_type=collider_type,
        category="clutter",
        agent_safe="true",
        affordances=affordances,
        extra_fields=optional_fields,
        api_schemas='["PhysicsCollisionAPI", "PhysicsRigidBodyAPI"]',
    )


# ── _find_custom_data_block ───────────────────────────────────────────────────


class TestFindCustomDataBlock:
    def test_returns_contents_of_simple_block(self) -> None:
        text = 'customData = { string foo = "bar" }'
        block = _find_custom_data_block(text)
        assert block is not None
        assert "foo" in block

    def test_returns_none_when_absent(self) -> None:
        text = 'def Xform "Foo" { }'
        assert _find_custom_data_block(text) is None

    def test_handles_nested_braces(self) -> None:
        text = 'customData = { dictionary nested = { string x = "y" } string z = "w" }'
        block = _find_custom_data_block(text)
        assert block is not None
        assert "nested" in block
        assert "z" in block

    def test_returns_none_for_unclosed_brace(self) -> None:
        text = "customData = { string foo = "
        assert _find_custom_data_block(text) is None


# ── parse_usda_metadata ───────────────────────────────────────────────────────


class TestParseUsdaMetadata:
    def test_parses_api_schemas(self) -> None:
        usda = _minimal_static_usda(
            api_schemas='["PhysicsCollisionAPI", "PhysicsRigidBodyAPI"]'
        )
        meta = parse_usda_metadata(usda)
        assert "PhysicsCollisionAPI" in meta["apiSchemas"]
        assert "PhysicsRigidBodyAPI" in meta["apiSchemas"]

    def test_parses_string_field(self) -> None:
        usda = _minimal_static_usda(asset_id="office-desk")
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["assetId"] == "office-desk"
        assert meta["customData"]["physicsBodyType"] == "static"

    def test_parses_float_field(self) -> None:
        usda = _minimal_dynamic_usda(mass=2.5)
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["physicsMassKg"] == pytest.approx(2.5)

    def test_parses_bool_true(self) -> None:
        usda = _minimal_static_usda(agent_safe="true")
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["agentSafe"] is True

    def test_parses_bool_false(self) -> None:
        usda = _minimal_static_usda(agent_safe="false")
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["agentSafe"] is False

    def test_parses_float3(self) -> None:
        usda = _minimal_static_usda(dims="(1.4, 0.75, 0.7)")
        meta = parse_usda_metadata(usda)
        dims = meta["customData"]["physicsDimensions"]
        assert dims == pytest.approx((1.4, 0.75, 0.7))

    def test_parses_string_array(self) -> None:
        usda = _minimal_static_usda(affordances='["work-surface", "seatable"]')
        meta = parse_usda_metadata(usda)
        aff = meta["customData"]["affordances"]
        assert aff == ["work-surface", "seatable"]

    def test_returns_empty_when_no_custom_data(self) -> None:
        usda = '#usda 1.0\ndef Xform "Foo" {}\n'
        meta = parse_usda_metadata(usda)
        assert meta["customData"] == {}
        assert meta["apiSchemas"] == []

    def test_parses_optional_friction(self) -> None:
        usda = _minimal_dynamic_usda(friction=0.6)
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["physicsFriction"] == pytest.approx(0.6)

    def test_parses_optional_restitution(self) -> None:
        usda = _minimal_dynamic_usda(restitution=0.1)
        meta = parse_usda_metadata(usda)
        assert meta["customData"]["physicsRestitution"] == pytest.approx(0.1)


# ── validate_prop ─────────────────────────────────────────────────────────────


class TestValidateProp:
    """Tests using temporary USDA files on disk."""

    def _write_usda(self, tmp_path: Path, filename: str, content: str) -> Path:
        p = tmp_path / filename
        p.write_text(content, encoding="utf-8")
        return p

    # ── File existence ────────────────────────────────────────────────────

    def test_missing_file_returns_error(self, tmp_path: Path) -> None:
        spec = {
            "assetId": "office-desk",
            "filename": "office-desk.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("not found" in e for e in errors)

    # ── PhysicsCollisionAPI ───────────────────────────────────────────────

    def test_missing_collision_api_returns_error(self, tmp_path: Path) -> None:
        content = _minimal_static_usda(api_schemas="[]")
        self._write_usda(tmp_path, "office-test-prop.usda", content)
        spec = {
            "assetId": "office-test-prop",
            "filename": "office-test-prop.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("PhysicsCollisionAPI" in e for e in errors)

    # ── PhysicsRigidBodyAPI on dynamic ────────────────────────────────────

    def test_dynamic_missing_rigidbody_api_returns_error(self, tmp_path: Path) -> None:
        # Dynamic prop but only PhysicsCollisionAPI (missing PhysicsRigidBodyAPI)
        content = _minimal_dynamic_usda(
            asset_id="office-laptop",
            mass=2.0,
        )
        # Override to remove PhysicsRigidBodyAPI
        content = content.replace(
            '["PhysicsCollisionAPI", "PhysicsRigidBodyAPI"]',
            '["PhysicsCollisionAPI"]',
        )
        self._write_usda(tmp_path, "office-laptop.usda", content)
        spec = {
            "assetId": "office-laptop",
            "filename": "office-laptop.usda",
            "physicsBodyType": "dynamic",
            "physicsColliderType": "box",
            "agentSafe": True,
            "affordances": ["input-device", "pickup"],
            "requiresMassKg": True,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("PhysicsRigidBodyAPI" in e for e in errors)

    # ── Missing customData fields ─────────────────────────────────────────

    def test_missing_semantic_label_returns_error(self, tmp_path: Path) -> None:
        usda = textwrap.dedent(
            """\
            #usda 1.0
            def Xform "Root" (
                prepend apiSchemas = ["PhysicsCollisionAPI"]
                customData = {
                    string physicsBodyType = "static"
                    string physicsColliderType = "box"
                    float3 physicsDimensions = (1.0, 1.0, 1.0)
                    string assetId = "office-test-prop"
                    string category = "furniture"
                    bool agentSafe = false
                    string[] affordances = ["work-surface"]
                }
            )
            {}
            """
        )
        self._write_usda(tmp_path, "office-test-prop.usda", usda)
        spec = {
            "assetId": "office-test-prop",
            "filename": "office-test-prop.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("semanticLabel" in e for e in errors)

    # ── Dynamic props require physicsMassKg ───────────────────────────────

    def test_dynamic_missing_mass_returns_error(self, tmp_path: Path) -> None:
        content = _minimal_dynamic_usda(
            asset_id="office-notebook", mass=0.0
        )
        # Replace mass with 0 to trigger the > 0 check
        content = content.replace("float physicsMassKg = 0.0", "")
        self._write_usda(tmp_path, "office-notebook.usda", content)
        spec = {
            "assetId": "office-notebook",
            "filename": "office-notebook.usda",
            "physicsBodyType": "dynamic",
            "physicsColliderType": "box",
            "agentSafe": True,
            "affordances": ["pickup"],
            "requiresMassKg": True,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("physicsMassKg" in e for e in errors)

    # ── agentSafe mismatch ────────────────────────────────────────────────

    def test_agent_safe_mismatch_returns_error(self, tmp_path: Path) -> None:
        content = _minimal_static_usda(
            asset_id="office-desk", agent_safe="true"  # should be false
        )
        self._write_usda(tmp_path, "office-desk.usda", content)
        spec = {
            "assetId": "office-desk",
            "filename": "office-desk.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("agentSafe" in e for e in errors)

    # ── physicsBodyType mismatch ──────────────────────────────────────────

    def test_body_type_mismatch_returns_error(self, tmp_path: Path) -> None:
        content = _minimal_static_usda(
            asset_id="office-desk",
            body_type="dynamic",  # should be static
        )
        self._write_usda(tmp_path, "office-desk.usda", content)
        spec = {
            "assetId": "office-desk",
            "filename": "office-desk.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("physicsBodyType" in e for e in errors)

    # ── affordances mismatch ──────────────────────────────────────────────

    def test_missing_affordance_tag_returns_error(self, tmp_path: Path) -> None:
        # Has "pickup" but not "input-device"
        content = _minimal_dynamic_usda(
            asset_id="office-laptop",
            affordances='["pickup"]',
            mass=2.0,
        )
        self._write_usda(tmp_path, "office-laptop.usda", content)
        spec = {
            "assetId": "office-laptop",
            "filename": "office-laptop.usda",
            "physicsBodyType": "dynamic",
            "physicsColliderType": "box",
            "agentSafe": True,
            "affordances": ["input-device", "pickup"],
            "requiresMassKg": True,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("input-device" in e for e in errors)

    # ── Valid static prop passes with no errors ───────────────────────────

    def test_valid_static_prop_passes(self, tmp_path: Path) -> None:
        content = _minimal_static_usda(
            asset_id="office-desk",
            body_type="static",
            collider_type="box",
            dims="(1.4, 0.75, 0.7)",
            agent_safe="false",
            affordances='["work-surface"]',
        )
        self._write_usda(tmp_path, "office-desk.usda", content)
        spec = {
            "assetId": "office-desk",
            "filename": "office-desk.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert errors == []

    # ── Valid dynamic prop passes with no errors ──────────────────────────

    def test_valid_dynamic_prop_passes(self, tmp_path: Path) -> None:
        content = _minimal_dynamic_usda(
            asset_id="office-laptop",
            collider_type="box",
            mass=2.0,
            friction=0.5,
            affordances='["input-device", "pickup"]',
        )
        self._write_usda(tmp_path, "office-laptop.usda", content)
        spec = {
            "assetId": "office-laptop",
            "filename": "office-laptop.usda",
            "physicsBodyType": "dynamic",
            "physicsColliderType": "box",
            "agentSafe": True,
            "affordances": ["input-device", "pickup"],
            "requiresMassKg": True,
        }
        errors = validate_prop(spec, tmp_path)
        assert errors == []

    # ── physicsDimensions must be positive ────────────────────────────────

    def test_zero_dimension_returns_error(self, tmp_path: Path) -> None:
        content = _minimal_static_usda(dims="(0.0, 0.75, 0.7)")
        self._write_usda(tmp_path, "office-test-prop.usda", content)
        spec = {
            "assetId": "office-test-prop",
            "filename": "office-test-prop.usda",
            "physicsBodyType": "static",
            "physicsColliderType": "box",
            "agentSafe": False,
            "affordances": ["work-surface"],
            "requiresMassKg": False,
        }
        errors = validate_prop(spec, tmp_path)
        assert any("physicsDimensions" in e for e in errors)


# ── Integration: validate real USDA files ─────────────────────────────────────


class TestRealUsdaFiles:
    """Validate the actual USDA files in assets/usd/office/props/.

    These tests fail if any required prop is missing or has bad metadata.
    They mirror what 'make assets-validate' checks.
    """

    @pytest.mark.skipif(
        not PROPS_DIR.is_dir(),
        reason=f"props directory not found: {PROPS_DIR}",
    )
    def test_all_required_prop_files_exist(self) -> None:
        missing = [
            spec["filename"]
            for spec in REQUIRED_PROPS
            if not (PROPS_DIR / spec["filename"]).is_file()
        ]
        assert missing == [], (
            f"Missing required USDA prop files in {PROPS_DIR}: {missing}"
        )

    @pytest.mark.skipif(
        not PROPS_DIR.is_dir(),
        reason=f"props directory not found: {PROPS_DIR}",
    )
    @pytest.mark.parametrize("prop_spec", REQUIRED_PROPS, ids=lambda s: s["assetId"])
    def test_prop_passes_validation(self, prop_spec: dict) -> None:
        errors = validate_prop(prop_spec, PROPS_DIR)
        assert errors == [], (
            f"Validation errors for {prop_spec['assetId']}:\n"
            + "\n".join(f"  - {e}" for e in errors)
        )


# ── Integration: main() exit codes ────────────────────────────────────────────


class TestMainExitCode:
    def test_exits_2_when_props_dir_missing(self, tmp_path: Path) -> None:
        nonexistent = str(tmp_path / "no-such-dir")
        result = main(["--props-dir", nonexistent])
        assert result == 2

    def test_exits_0_with_valid_props_dir(self, tmp_path: Path) -> None:
        """Write all required props to a temp dir and confirm main() returns 0."""
        for spec in REQUIRED_PROPS:
            if spec["physicsBodyType"] == "dynamic":
                content = _minimal_dynamic_usda(
                    asset_id=spec["assetId"],
                    collider_type=spec["physicsColliderType"],
                    mass=1.0,
                    affordances="["
                    + ", ".join(f'"{a}"' for a in spec["affordances"])
                    + "]",
                )
            else:
                content = _minimal_static_usda(
                    asset_id=spec["assetId"],
                    body_type=spec["physicsBodyType"],
                    collider_type=spec["physicsColliderType"],
                    agent_safe="false",
                    affordances="["
                    + ", ".join(f'"{a}"' for a in spec["affordances"])
                    + "]",
                )
            (tmp_path / spec["filename"]).write_text(content, encoding="utf-8")

        result = main(["--props-dir", str(tmp_path)])
        assert result == 0

    def test_exits_1_when_a_prop_has_bad_metadata(self, tmp_path: Path) -> None:
        """Write all props but make office-desk have a wrong body type."""
        for spec in REQUIRED_PROPS:
            if spec["physicsBodyType"] == "dynamic":
                content = _minimal_dynamic_usda(
                    asset_id=spec["assetId"],
                    collider_type=spec["physicsColliderType"],
                    mass=1.0,
                    affordances="["
                    + ", ".join(f'"{a}"' for a in spec["affordances"])
                    + "]",
                )
            elif spec["assetId"] == "office-desk":
                # Intentionally wrong body type
                content = _minimal_static_usda(
                    asset_id=spec["assetId"],
                    body_type="dynamic",  # wrong — should be static
                    collider_type=spec["physicsColliderType"],
                    agent_safe="false",
                    affordances="["
                    + ", ".join(f'"{a}"' for a in spec["affordances"])
                    + "]",
                )
            else:
                content = _minimal_static_usda(
                    asset_id=spec["assetId"],
                    body_type=spec["physicsBodyType"],
                    collider_type=spec["physicsColliderType"],
                    agent_safe="false",
                    affordances="["
                    + ", ".join(f'"{a}"' for a in spec["affordances"])
                    + "]",
                )
            (tmp_path / spec["filename"]).write_text(content, encoding="utf-8")

        result = main(["--props-dir", str(tmp_path)])
        assert result == 1
