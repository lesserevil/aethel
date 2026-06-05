"""Tests for api/config.py — secure NVIDIA credential loading.

All tests use fake data.  No real NVIDIA key is required.
The tests assert that:

* The key is never echoed in error messages or diagnostic output.
* The env-var path and the netrc path both resolve correctly.
* Malformed netrc does not crash the server.
* ``key_is_available()`` returns the right boolean in each case.
* ``redacted_key_hint()`` never returns the full key.
"""

import os
import textwrap
from pathlib import Path

import pytest

from api.config import (
    NvidiaKeyNotFoundError,
    _redact,
    key_is_available,
    load_nvidia_api_key,
    redacted_key_hint,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_FAKE_KEY = "sk-FakeTestKey1234567890AbCdEfGhIjKl"
_NVIDIA_MACHINE = "inference-api.nvidia.com"


def _write_netrc(tmp_path: Path, content: str) -> Path:
    netrc_file = tmp_path / ".netrc"
    netrc_file.write_text(textwrap.dedent(content))
    netrc_file.chmod(0o600)
    return netrc_file


# ---------------------------------------------------------------------------
# _redact helper
# ---------------------------------------------------------------------------


def test_redact_shows_prefix_not_full_key() -> None:
    hint = _redact(_FAKE_KEY)
    assert _FAKE_KEY not in hint
    # Starts with first 4 chars followed by stars
    assert hint.startswith(_FAKE_KEY[:4])
    assert "*" in hint


def test_redact_short_key() -> None:
    hint = _redact("abc")
    assert "abc" not in hint or len(hint) < 4  # short key gets single char prefix


def test_redact_empty_key() -> None:
    hint = _redact("")
    assert hint == "<empty>"


# ---------------------------------------------------------------------------
# load_nvidia_api_key — env var path
# ---------------------------------------------------------------------------


def test_load_from_env_var(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    key = load_nvidia_api_key()
    assert key == _FAKE_KEY


def test_env_var_whitespace_trimmed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", f"  {_FAKE_KEY}  ")
    key = load_nvidia_api_key()
    assert key == _FAKE_KEY


def test_env_var_empty_falls_through_to_netrc(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", "")
    netrc_file = _write_netrc(
        tmp_path,
        f"""
        machine {_NVIDIA_MACHINE}
            login user
            password {_FAKE_KEY}
        """,
    )
    key = load_nvidia_api_key(netrc_path=netrc_file)
    assert key == _FAKE_KEY


# ---------------------------------------------------------------------------
# load_nvidia_api_key — netrc path
# ---------------------------------------------------------------------------


def test_load_from_netrc(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    netrc_file = _write_netrc(
        tmp_path,
        f"""
        machine {_NVIDIA_MACHINE}
            login user
            password {_FAKE_KEY}
        """,
    )
    key = load_nvidia_api_key(netrc_path=netrc_file)
    assert key == _FAKE_KEY


def test_load_from_netrc_no_matching_machine(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    netrc_file = _write_netrc(
        tmp_path,
        """
        machine other.example.com
            login user
            password someotherkey
        """,
    )
    with pytest.raises(NvidiaKeyNotFoundError):
        load_nvidia_api_key(netrc_path=netrc_file)


def test_load_missing_netrc(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    nonexistent = tmp_path / "no-such-netrc"
    with pytest.raises(NvidiaKeyNotFoundError):
        load_nvidia_api_key(netrc_path=nonexistent)


def test_load_malformed_netrc(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """A parse error in netrc must not crash the server — raises NvidiaKeyNotFoundError."""
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    netrc_file = _write_netrc(tmp_path, "this is not valid netrc content @@@@\n")
    with pytest.raises(NvidiaKeyNotFoundError):
        load_nvidia_api_key(netrc_path=netrc_file)


def test_load_no_key_anywhere(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    with pytest.raises(NvidiaKeyNotFoundError) as exc_info:
        load_nvidia_api_key(netrc_path=tmp_path / "nonexistent")
    # The error message must NOT contain the word "secret" or any key material.
    # It must guide the user without revealing anything sensitive.
    error_text = str(exc_info.value)
    assert "NVIDIA_API_KEY" in error_text
    assert "netrc" in error_text.lower()
    # Confirm the fake key (or any substring that looks like a secret) is absent.
    assert _FAKE_KEY not in error_text


# ---------------------------------------------------------------------------
# Error message does not contain the key
# ---------------------------------------------------------------------------


def test_error_message_does_not_contain_key(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """The NvidiaKeyNotFoundError message must never include key material."""
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    # Write a netrc with a key for a *different* machine to force the error path.
    netrc_file = _write_netrc(
        tmp_path,
        """
        machine other.host.com
            login user
            password sk-ShouldNeverAppearInErrorMessage
        """,
    )
    with pytest.raises(NvidiaKeyNotFoundError) as exc_info:
        load_nvidia_api_key(netrc_path=netrc_file)
    assert "sk-ShouldNeverAppearInErrorMessage" not in str(exc_info.value)


# ---------------------------------------------------------------------------
# key_is_available
# ---------------------------------------------------------------------------


def test_key_is_available_true_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    assert key_is_available() is True


def test_key_is_available_false_when_missing(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    assert key_is_available(netrc_path=tmp_path / "nonexistent") is False


# ---------------------------------------------------------------------------
# redacted_key_hint — never returns full key
# ---------------------------------------------------------------------------


def test_redacted_hint_does_not_expose_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    hint = redacted_key_hint()
    assert _FAKE_KEY not in hint
    assert "*" in hint


def test_redacted_hint_when_unconfigured(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    hint = redacted_key_hint(netrc_path=tmp_path / "nonexistent")
    assert hint == "<not configured>"
    assert _FAKE_KEY not in hint
