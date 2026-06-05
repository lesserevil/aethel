"""Unit tests for scripts/nemotron/nemotron_smoke_check.py.

No real NVIDIA API key or network access is required.  All external calls are
mocked.  Tests cover:

- dry-run mode output and exit codes
- credential availability checks
- successful live-check path
- skip on missing or invalid credentials
- skip on rate limit
- fail on timeout and generic errors
- output never contains the raw API key
- build_smoke_messages structure and content
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add repo root to path so the api package is importable.
import sys
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from scripts.nemotron.nemotron_smoke_check import (  # noqa: E402
    _EXIT_FAIL,
    _EXIT_OK,
    _EXIT_SKIP,
    _SYSTEM_PROMPT,
    _USER_MESSAGE,
    build_smoke_messages,
    check_credentials,
    main,
    run_dry_run,
    run_live_check,
)

# ── Constants used across tests ───────────────────────────────────────────────

_FAKE_KEY = "sk-FakeSmokeCheckKey12345"


# ── build_smoke_messages ──────────────────────────────────────────────────────


def test_build_smoke_messages_returns_two_messages() -> None:
    msgs = build_smoke_messages()
    assert len(msgs) == 2


def test_build_smoke_messages_system_role() -> None:
    msgs = build_smoke_messages()
    assert msgs[0]["role"] == "system"


def test_build_smoke_messages_user_role() -> None:
    msgs = build_smoke_messages()
    assert msgs[1]["role"] == "user"


def test_build_smoke_messages_system_content_not_empty() -> None:
    msgs = build_smoke_messages()
    assert msgs[0]["content"].strip()


def test_build_smoke_messages_user_content_not_empty() -> None:
    msgs = build_smoke_messages()
    assert msgs[1]["content"].strip()


def test_build_smoke_messages_system_contains_aethel() -> None:
    msgs = build_smoke_messages()
    # System prompt must ground the model in the Aethel scene context.
    assert "Aethel" in msgs[0]["content"]


def test_build_smoke_messages_user_content_is_short() -> None:
    """User message should be short to minimise token usage."""
    msgs = build_smoke_messages()
    assert len(msgs[1]["content"]) < 200


def test_build_smoke_messages_no_secrets() -> None:
    """Neither message content should contain credential-looking strings."""
    msgs = build_smoke_messages()
    for msg in msgs:
        assert "sk-" not in msg["content"], "Message contains a credential-like 'sk-' prefix"


# ── check_credentials ─────────────────────────────────────────────────────────


def test_check_credentials_true_when_key_set(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    available, hint = check_credentials()
    assert available is True


def test_check_credentials_false_when_key_absent(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    # Patch key_is_available and redacted_key_hint to avoid filesystem access.
    with (
        patch("scripts.nemotron.nemotron_smoke_check.key_is_available", return_value=False),
        patch(
            "scripts.nemotron.nemotron_smoke_check.redacted_key_hint",
            return_value="<not configured>",
        ),
    ):
        available, hint = check_credentials()
    assert available is False
    assert "<not configured>" in hint


def test_check_credentials_hint_never_contains_full_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    _, hint = check_credentials()
    assert _FAKE_KEY not in hint


def test_check_credentials_hint_contains_redaction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    _, hint = check_credentials()
    # Redacted hint should contain asterisks.
    assert "*" in hint


# ── run_dry_run ───────────────────────────────────────────────────────────────


def test_run_dry_run_returns_ok(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    result = run_dry_run()
    assert result == _EXIT_OK


def test_run_dry_run_prints_dry_run_label(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    run_dry_run()
    captured = capsys.readouterr()
    assert "DRY-RUN" in captured.out.upper() or "dry-run" in captured.out.lower()


def test_run_dry_run_prints_endpoint(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    run_dry_run()
    captured = capsys.readouterr()
    assert "inference-api.nvidia.com" in captured.out


def test_run_dry_run_prints_model(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    run_dry_run()
    captured = capsys.readouterr()
    assert "nemotron" in captured.out.lower()


def test_run_dry_run_does_not_print_full_key(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """The dry-run output must never contain the raw API key."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    run_dry_run()
    captured = capsys.readouterr()
    assert _FAKE_KEY not in captured.out
    assert _FAKE_KEY not in captured.err


def test_run_dry_run_no_credential_shows_not_configured(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    with (
        patch("scripts.nemotron.nemotron_smoke_check.key_is_available", return_value=False),
        patch(
            "scripts.nemotron.nemotron_smoke_check.redacted_key_hint",
            return_value="<not configured>",
        ),
    ):
        result = run_dry_run()
    assert result == _EXIT_OK  # dry-run always exits OK
    captured = capsys.readouterr()
    assert "not configured" in captured.out


# ── run_live_check — skip paths ───────────────────────────────────────────────


def test_live_check_skips_when_no_credential(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """SKIP (exit 2) when no API key is configured."""
    with (
        patch("scripts.nemotron.nemotron_smoke_check.key_is_available", return_value=False),
        patch(
            "scripts.nemotron.nemotron_smoke_check.redacted_key_hint",
            return_value="<not configured>",
        ),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_SKIP


def test_live_check_skip_does_not_print_key(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    with (
        patch("scripts.nemotron.nemotron_smoke_check.key_is_available", return_value=False),
        patch(
            "scripts.nemotron.nemotron_smoke_check.redacted_key_hint",
            return_value="<not configured>",
        ),
    ):
        run_live_check(timeout=5.0, max_tokens=64)
    captured = capsys.readouterr()
    assert _FAKE_KEY not in captured.out
    assert _FAKE_KEY not in captured.err


def test_live_check_skips_on_auth_error(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """SKIP when NVIDIA rejects the credential (NvidiaAuthError)."""
    from api.nvidia_client import NvidiaAuthError

    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=NvidiaAuthError("HTTP 401"),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_SKIP


def test_live_check_auth_error_does_not_print_key(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    from api.nvidia_client import NvidiaAuthError

    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=NvidiaAuthError("HTTP 401"),
    ):
        run_live_check(timeout=5.0, max_tokens=64)
    captured = capsys.readouterr()
    assert _FAKE_KEY not in captured.out
    assert _FAKE_KEY not in captured.err


def test_live_check_skips_on_rate_limit(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """SKIP when NVIDIA returns a rate limit error (NvidiaRateLimitError)."""
    from api.nvidia_client import NvidiaRateLimitError

    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=NvidiaRateLimitError("HTTP 429"),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_SKIP


# ── run_live_check — fail paths ───────────────────────────────────────────────


def test_live_check_fails_on_timeout(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """FAIL (exit 1) when the request times out (NvidiaTimeoutError)."""
    from api.nvidia_client import NvidiaTimeoutError

    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=NvidiaTimeoutError("timed out"),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_FAIL


def test_live_check_fails_on_client_error(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """FAIL (exit 1) on generic NvidiaClientError."""
    from api.nvidia_client import NvidiaClientError

    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=NvidiaClientError("unexpected error"),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_FAIL


def test_live_check_fails_on_unhandled_exception(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """FAIL (exit 1) on any unexpected exception."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        side_effect=RuntimeError("something broke"),
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_FAIL


def test_live_check_fails_on_empty_reply(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """FAIL when the model returns an empty string."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value="",
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_FAIL


def test_live_check_fails_on_whitespace_only_reply(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """FAIL when the model returns only whitespace."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value="   \n  ",
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_FAIL


# ── run_live_check — success path ─────────────────────────────────────────────


def test_live_check_returns_ok_on_valid_reply(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """EXIT_OK when the model returns a non-empty text response."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value="OK",
    ):
        result = run_live_check(timeout=5.0, max_tokens=64)
    assert result == _EXIT_OK


def test_live_check_success_prints_response_preview(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """Success output includes a preview of the reply text."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value="This is the model reply.",
    ):
        run_live_check(timeout=5.0, max_tokens=64)
    captured = capsys.readouterr()
    assert "This is the model reply." in captured.out


def test_live_check_success_does_not_print_key(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """Success output must not contain the raw API key."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value="OK",
    ):
        run_live_check(timeout=5.0, max_tokens=64)
    captured = capsys.readouterr()
    assert _FAKE_KEY not in captured.out
    assert _FAKE_KEY not in captured.err


def test_live_check_success_truncates_long_reply(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """Long replies are truncated to a preview in the output."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    long_reply = "A" * 500
    with patch(
        "scripts.nemotron.nemotron_smoke_check._live_chat",
        new_callable=AsyncMock,
        return_value=long_reply,
    ):
        run_live_check(timeout=5.0, max_tokens=64)
    captured = capsys.readouterr()
    # The truncation ellipsis should appear.
    assert "…" in captured.out or "..." in captured.out
    # The full 500-char reply should NOT appear (truncated at 200).
    assert long_reply not in captured.out


# ── main() CLI ────────────────────────────────────────────────────────────────


def test_main_dry_run_flag(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """``main(["--dry-run"])`` routes to run_dry_run and exits 0."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    result = main(["--dry-run"])
    assert result == _EXIT_OK


def test_main_no_credential_exits_skip(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """``main([])`` exits SKIP when no credential is configured."""
    with (
        patch("scripts.nemotron.nemotron_smoke_check.key_is_available", return_value=False),
        patch(
            "scripts.nemotron.nemotron_smoke_check.redacted_key_hint",
            return_value="<not configured>",
        ),
    ):
        result = main([])
    assert result == _EXIT_SKIP


def test_main_passes_timeout_to_live_check(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """``--timeout`` is parsed and forwarded to the live check."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    captured_kwargs: list[dict] = []

    def _fake_run_live(**kwargs: Any) -> int:
        captured_kwargs.append(kwargs)
        return _EXIT_OK

    with patch(
        "scripts.nemotron.nemotron_smoke_check.run_live_check",
        side_effect=_fake_run_live,
    ):
        main(["--timeout", "15"])

    assert len(captured_kwargs) == 1
    assert captured_kwargs[0]["timeout"] == 15.0


def test_main_passes_max_tokens_to_live_check(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture
) -> None:
    """``--max-tokens`` is parsed and forwarded to the live check."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    captured_kwargs: list[dict] = []

    def _fake_run_live(**kwargs: Any) -> int:
        captured_kwargs.append(kwargs)
        return _EXIT_OK

    with patch(
        "scripts.nemotron.nemotron_smoke_check.run_live_check",
        side_effect=_fake_run_live,
    ):
        main(["--max-tokens", "32"])

    assert len(captured_kwargs) == 1
    assert captured_kwargs[0]["max_tokens"] == 32
