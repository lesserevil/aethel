#!/usr/bin/env python3
"""Nemotron Live Smoke Check — opt-in live endpoint verification script.

Sends a low-token text request to the configured NVIDIA Nemotron model using
the same backend client and credential loading path used by ``/api/chat``.
This proves that the credential, endpoint, model id, prompt mapping, and
response parsing all work together with a real network call.

This script is intentionally NOT wired into ``make test`` or any default CI
gate.  It requires a valid NVIDIA API key and network access to
``inference-api.nvidia.com``.  When credentials are absent or invalid, the
script exits with SKIP (exit code 2) rather than failing CI.

Usage
-----
    python3 scripts/nemotron/nemotron_smoke_check.py [options]

Or via make::

    make smoke-nemotron

Options
-------
    --dry-run        Build and print the prompt without calling NVIDIA.
                     Exits 0 without network access.
    --timeout N      Request timeout in seconds (default: 30).
    --max-tokens N   Maximum tokens in the model response (default: 64).

Exit codes
----------
    0   Smoke check completed — the model returned a text response.
    1   Unexpected failure — check the error message.
    2   SKIP — credentials are absent or invalid; not a CI failure.

Secrets
-------
The NVIDIA API key is read server-side from NVIDIA_API_KEY or ~/.netrc
and is never printed, logged, or returned in any output.  Diagnostic
messages show only a redacted hint such as ``sk-X********``.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# ── Repo root on sys.path ──────────────────────────────────────────────────────
# Allow importing the api package regardless of the working directory.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from api.config import (  # noqa: E402 — after sys.path adjustment
    NvidiaKeyNotFoundError,
    key_is_available,
    redacted_key_hint,
)
from api.nvidia_client import (  # noqa: E402
    DEFAULT_NVIDIA_BASE_URL,
    DEFAULT_NVIDIA_MODEL,
    NvidiaAuthError,
    NvidiaClient,
    NvidiaClientError,
    NvidiaRateLimitError,
    NvidiaTimeoutError,
)

# ── Exit codes ────────────────────────────────────────────────────────────────

_EXIT_OK = 0
_EXIT_FAIL = 1
_EXIT_SKIP = 2

# ── Minimal Aethel scene context ──────────────────────────────────────────────
# This is the same scene context the prompt builder would include for a default
# Aethel session.  Kept deliberately small to minimise token usage.

_SYSTEM_PROMPT = (
    "You are Aethel, an AI assistant in a virtual 3D office environment. "
    "Persona: default. Tone: helpful. "
    "Environment: office preset, afternoon, bright lighting, quiet ambience. "
    "Objects present: none. "
    "Instructions: answer as Aethel and be concise."
)

_USER_MESSAGE = "Smoke check: reply with the single word 'OK'."


# ── Prompt helpers ────────────────────────────────────────────────────────────


def build_smoke_messages() -> list[dict[str, str]]:
    """Return the minimal OpenAI-style messages list for the smoke check.

    Returns:
        List of two message dicts: a system message with a small Aethel scene
        context and a user message requesting a single-word reply.
    """
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": _USER_MESSAGE},
    ]


# ── Credential check ──────────────────────────────────────────────────────────


def check_credentials() -> tuple[bool, str]:
    """Return ``(available, hint)`` for the current NVIDIA credential state.

    The hint is a redacted representation of the key (e.g. ``"sk-X********"``)
    or ``"<not configured>"``.  The raw key value is never returned.
    """
    available = key_is_available()
    hint = redacted_key_hint()
    return available, hint


# ── Dry-run ───────────────────────────────────────────────────────────────────


def run_dry_run() -> int:
    """Build and print the smoke-check prompt without calling the NVIDIA API.

    Returns:
        :data:`_EXIT_OK` always — dry-run never fails unless imports break.
    """
    available, hint = check_credentials()
    messages = build_smoke_messages()

    print("[smoke] DRY-RUN mode — no NVIDIA API call will be made.")
    print(f"[smoke] Credential status : {'configured' if available else 'not configured'}")
    print(f"[smoke] Key hint          : {hint}")
    print(f"[smoke] Endpoint          : {DEFAULT_NVIDIA_BASE_URL}/chat/completions")
    print(f"[smoke] Model             : {DEFAULT_NVIDIA_MODEL}")
    print(f"[smoke] Messages ({len(messages)}):")
    for i, msg in enumerate(messages, 1):
        role = msg["role"]
        content_preview = msg["content"][:80].replace("\n", " ")
        ellipsis = "…" if len(msg["content"]) > 80 else ""
        print(f"  {i}. [{role}] {content_preview}{ellipsis}")
    print("[smoke] Dry-run passed.")
    return _EXIT_OK


# ── Live check ────────────────────────────────────────────────────────────────


async def _live_chat(messages: list[dict[str, str]], *, timeout: float) -> str:
    """Send the smoke check messages and return the model reply text.

    Args:
        messages: The smoke-check messages list from :func:`build_smoke_messages`.
        timeout: Per-request timeout in seconds.

    Returns:
        The assistant reply text.

    Raises:
        NvidiaAuthError: Credential missing or rejected by NVIDIA.
        NvidiaRateLimitError: Rate limit hit.
        NvidiaTimeoutError: Request timed out.
        NvidiaClientError: Any other transport / API error.
    """
    client = NvidiaClient(timeout_seconds=timeout)
    return await client.chat(messages)


def run_live_check(*, timeout: float, max_tokens: int) -> int:
    """Run the live smoke check against the NVIDIA API.

    Args:
        timeout: Per-request timeout in seconds.
        max_tokens: Maximum tokens requested from the model.  This controls
            output length — keep it small (≤64) for the smoke check.

    Returns:
        :data:`_EXIT_OK`, :data:`_EXIT_FAIL`, or :data:`_EXIT_SKIP`.
    """
    # ── Credential availability ────────────────────────────────────────────
    available, hint = check_credentials()
    print(f"[smoke] Credential status : {'configured' if available else 'not configured'}")
    print(f"[smoke] Key hint          : {hint}")  # redacted — never raw key

    if not available:
        print(
            "[smoke] SKIP: NVIDIA API key is not configured.\n"
            "  Set NVIDIA_API_KEY or add a ~/.netrc entry for "
            "inference-api.nvidia.com.\n"
            "  Tip: run --dry-run to validate the prompt without a key.",
            file=sys.stderr,
        )
        return _EXIT_SKIP

    # ── Build messages ─────────────────────────────────────────────────────
    messages = build_smoke_messages()
    print(f"[smoke] Endpoint          : {DEFAULT_NVIDIA_BASE_URL}/chat/completions")
    print(f"[smoke] Model             : {DEFAULT_NVIDIA_MODEL}")
    print(f"[smoke] Messages          : {len(messages)} (system + user)")
    print(f"[smoke] Timeout           : {timeout}s")
    print(f"[smoke] Max tokens        : {max_tokens}")
    print("[smoke] Sending request…")

    # ── Call the model ─────────────────────────────────────────────────────
    try:
        reply = asyncio.run(_live_chat(messages, timeout=timeout))
    except NvidiaAuthError as exc:
        print(
            f"[smoke] SKIP: Authentication failed — {exc}\n"
            "  Check that NVIDIA_API_KEY is a valid sk- virtual key.\n"
            "  The key value has not been printed or logged.",
            file=sys.stderr,
        )
        return _EXIT_SKIP
    except NvidiaRateLimitError as exc:
        print(
            f"[smoke] SKIP: Rate limit exceeded — {exc}\n"
            "  Wait a moment and retry.",
            file=sys.stderr,
        )
        return _EXIT_SKIP
    except NvidiaTimeoutError as exc:
        print(
            f"[smoke] FAIL: Request timed out — {exc}",
            file=sys.stderr,
        )
        return _EXIT_FAIL
    except NvidiaClientError as exc:
        print(
            f"[smoke] FAIL: Unexpected client error — {exc}",
            file=sys.stderr,
        )
        return _EXIT_FAIL
    except Exception as exc:  # noqa: BLE001
        print(
            f"[smoke] FAIL: Unhandled error — {exc}",
            file=sys.stderr,
        )
        return _EXIT_FAIL

    # ── Validate response ──────────────────────────────────────────────────
    if not isinstance(reply, str) or not reply.strip():
        print(
            "[smoke] FAIL: Model returned an empty or non-string response.",
            file=sys.stderr,
        )
        return _EXIT_FAIL

    # Show only the first 200 characters — never the authorization header.
    reply_preview = reply[:200].replace("\n", " ")
    ellipsis = "…" if len(reply) > 200 else ""
    print(f"[smoke] Response ({len(reply)} chars): {reply_preview}{ellipsis}")
    print("[smoke] Nemotron smoke check PASSED.")
    return _EXIT_OK


# ── CLI ───────────────────────────────────────────────────────────────────────


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Build and print the prompt without calling the NVIDIA API. "
            "Exits 0 without network access."
        ),
    )
    p.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        metavar="N",
        help="Request timeout in seconds (default: 30).",
    )
    p.add_argument(
        "--max-tokens",
        type=int,
        default=64,
        metavar="N",
        help="Maximum tokens in the model response (default: 64).",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Entry point for the Nemotron live smoke check.

    Returns:
        Exit code — 0 = OK, 1 = FAIL, 2 = SKIP.
    """
    args = _parse_args(argv)

    if args.dry_run:
        return run_dry_run()

    return run_live_check(timeout=args.timeout, max_tokens=args.max_tokens)


if __name__ == "__main__":
    sys.exit(main())
