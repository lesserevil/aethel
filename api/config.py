"""Secure configuration loading for the Aethel backend chat service.

Credential resolution order:
1. NVIDIA_API_KEY environment variable.
2. ~/.netrc machine entry for inference-api.nvidia.com.

The raw secret is never logged, printed, or included in error messages.
"""

import netrc
import os
from pathlib import Path
from typing import Optional

# The machine name used in ~/.netrc to store NVIDIA credentials.
_NVIDIA_NETRC_MACHINE = "inference-api.nvidia.com"


def _redact(value: str) -> str:
    """Return a redacted representation of a secret for safe logging."""
    if not value:
        return "<empty>"
    prefix = value[:4] if len(value) >= 4 else value[:1]
    return f"{prefix}{'*' * 8}"


class NvidiaKeyNotFoundError(RuntimeError):
    """Raised when the NVIDIA API key cannot be found in the environment or netrc."""

    pass


def load_nvidia_api_key(
    netrc_path: Optional[Path] = None,
) -> str:
    """Return the NVIDIA API key without printing the secret value.

    Resolution order:
    1. ``NVIDIA_API_KEY`` environment variable.
    2. ``~/.netrc`` ``machine inference-api.nvidia.com`` ``password`` field.

    Args:
        netrc_path: Override the default ``~/.netrc`` path.  Pass a
            :class:`~pathlib.Path` to a temporary file in tests.

    Returns:
        The raw API key string.

    Raises:
        NvidiaKeyNotFoundError: When neither source contains a key.
    """
    # 1. Environment variable takes priority.
    env_key = os.environ.get("NVIDIA_API_KEY", "").strip()
    if env_key:
        return env_key

    # 2. Fall back to ~/.netrc.
    resolved_path = netrc_path or (Path.home() / ".netrc")
    if resolved_path.exists():
        try:
            rc = netrc.netrc(str(resolved_path))
            authenticator = rc.authenticators(_NVIDIA_NETRC_MACHINE)
            if authenticator is not None:
                # authenticators() returns (login, account, password)
                _, _, password = authenticator
                if password:
                    return password
        except netrc.NetrcParseError:
            # Malformed netrc — fall through to the error below.
            pass

    raise NvidiaKeyNotFoundError(
        "NVIDIA API key not found.  Set the NVIDIA_API_KEY environment variable "
        f"or add a 'machine {_NVIDIA_NETRC_MACHINE} password <key>' entry to ~/.netrc."
    )


def key_is_available(netrc_path: Optional[Path] = None) -> bool:
    """Return True if an NVIDIA API key can be resolved, False otherwise."""
    try:
        load_nvidia_api_key(netrc_path=netrc_path)
        return True
    except NvidiaKeyNotFoundError:
        return False


def redacted_key_hint(netrc_path: Optional[Path] = None) -> str:
    """Return a safe, redacted hint about the current key value for diagnostic output.

    Never returns the actual key.  Example: ``"sk-X********"``
    """
    try:
        key = load_nvidia_api_key(netrc_path=netrc_path)
        return _redact(key)
    except NvidiaKeyNotFoundError:
        return "<not configured>"
