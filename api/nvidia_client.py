"""NVIDIA Nemotron chat client for the Aethel backend.

Calls the OpenAI-compatible NVIDIA inference API at:
    https://inference-api.nvidia.com/v1/chat/completions

Credentials are read from :func:`api.config.load_nvidia_api_key` — never
hardcoded here.  Request metadata (model, message count, status) is logged at
DEBUG level.  The Authorization header and prompt text are *never* logged.

Confirmed hosted model id (TASK-19.1):
    nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning

Usage::

    client = NvidiaClient()
    reply = await client.chat(messages)
"""

import asyncio
import logging
from typing import Any, Literal, Optional, Union

import httpx
from pydantic import BaseModel

from .config import NvidiaKeyNotFoundError, load_nvidia_api_key

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

#: Confirmed hosted model id from TASK-19.1 final summary.
DEFAULT_NVIDIA_MODEL = "nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

#: Base URL for the NVIDIA OpenAI-compatible inference API.
DEFAULT_NVIDIA_BASE_URL = "https://inference-api.nvidia.com/v1"

#: Default request timeout in seconds.
DEFAULT_TIMEOUT_SECONDS = 30.0


# ── Error hierarchy ───────────────────────────────────────────────────────────


class NvidiaClientError(Exception):
    """Base class for all NVIDIA client errors."""


class NvidiaAuthError(NvidiaClientError):
    """NVIDIA API returned HTTP 401 or 403, or no API key is configured."""


class NvidiaRateLimitError(NvidiaClientError):
    """NVIDIA API returned HTTP 429 (rate limit exceeded)."""


class NvidiaTimeoutError(NvidiaClientError):
    """The request to the NVIDIA API timed out or was cancelled."""


class NvidiaResponseError(NvidiaClientError):
    """NVIDIA API returned a malformed or unexpected response body."""


# ── Typed multimodal extension points ────────────────────────────────────────
# These types are not sent in the first integration but provide a typed path
# for future image_url / audio_url / video_url inputs.


class TextContent(BaseModel):
    """Plain text content part (used in first integration)."""

    type: Literal["text"] = "text"
    text: str


class ImageUrlContent(BaseModel):
    """Extension point: image_url multimodal input (not sent in this task)."""

    type: Literal["image_url"] = "image_url"
    image_url: dict[str, Any]


class AudioUrlContent(BaseModel):
    """Extension point: audio_url multimodal input (not sent in this task)."""

    type: Literal["audio_url"] = "audio_url"
    audio_url: dict[str, Any]


class VideoUrlContent(BaseModel):
    """Extension point: video_url multimodal input (not sent in this task)."""

    type: Literal["video_url"] = "video_url"
    video_url: dict[str, Any]


#: Union of all supported multimodal content part types.
ContentPart = Union[TextContent, ImageUrlContent, AudioUrlContent, VideoUrlContent]


# ── Client ────────────────────────────────────────────────────────────────────


class NvidiaClient:
    """Async wrapper around the NVIDIA OpenAI-compatible chat completions API.

    Args:
        api_key: Optional explicit API key.  When omitted, the key is resolved
            lazily from :func:`api.config.load_nvidia_api_key` on each call.
        base_url: NVIDIA API base URL.  Override for testing or alternative
            deployments.
        model: Hosted model id to use.
        timeout_seconds: Per-request timeout in seconds.
    """

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        base_url: str = DEFAULT_NVIDIA_BASE_URL,
        model: str = DEFAULT_NVIDIA_MODEL,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout_seconds

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _resolve_key(self) -> str:
        """Return the API key without logging it."""
        if self._api_key:
            return self._api_key
        try:
            return load_nvidia_api_key()
        except NvidiaKeyNotFoundError as exc:
            raise NvidiaAuthError("NVIDIA API key not configured") from exc

    # ── Public API ────────────────────────────────────────────────────────────

    async def chat(
        self,
        messages: list[dict[str, Any]],
        *,
        enable_reasoning: bool = False,
        extra_content_parts: Optional[list[ContentPart]] = None,
    ) -> str:
        """Send a chat completion request and return the assistant reply text.

        Args:
            messages: OpenAI-style messages list::

                [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]

            enable_reasoning: When *False* (default), passes
                ``chat_template_kwargs`` to suppress chain-of-thought reasoning
                traces so the user sees only the final answer.  Set *True* only
                when raw reasoning output is explicitly required.
            extra_content_parts: Typed extension point for future multimodal
                inputs (``image_url``, ``audio_url``, ``video_url``).  Not sent
                in the first integration — reserved for future tasks.

        Returns:
            The assistant reply text stripped of reasoning traces (by default).

        Raises:
            NvidiaAuthError: 401 or 403 from the API, or no key configured.
            NvidiaRateLimitError: 429 rate-limit response.
            NvidiaTimeoutError: Request timed out or was cancelled.
            NvidiaResponseError: Malformed or missing response body.
            NvidiaClientError: Any other unexpected transport or API error.
        """
        api_key = self._resolve_key()
        url = f"{self._base_url}/chat/completions"

        payload: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
        }

        if not enable_reasoning:
            # Disable chain-of-thought / reasoning traces in the response.
            # NVIDIA documents this via chat_template_kwargs for reasoning models.
            payload["chat_template_kwargs"] = {"thinking": False}

        # Log request metadata only — never the Authorization header or content.
        logger.debug(
            "NVIDIA chat: url=%s model=%s num_messages=%d reasoning=%s",
            url,
            self._model,
            len(messages),
            enable_reasoning,
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as http_client:
                response = await http_client.post(url, json=payload, headers=headers)
        except asyncio.CancelledError:
            raise NvidiaTimeoutError("NVIDIA chat request was cancelled") from None
        except httpx.TimeoutException as exc:
            raise NvidiaTimeoutError(
                f"NVIDIA chat request timed out after {self._timeout}s: {exc}"
            ) from exc
        except httpx.HTTPError as exc:
            raise NvidiaClientError(f"NVIDIA HTTP transport error: {exc}") from exc

        logger.debug("NVIDIA chat response: status=%d", response.status_code)

        if response.status_code in (401, 403):
            raise NvidiaAuthError(
                f"NVIDIA API authentication failed (HTTP {response.status_code}). "
                "Verify that NVIDIA_API_KEY is a valid sk- virtual key."
            )
        if response.status_code == 429:
            raise NvidiaRateLimitError(
                "NVIDIA API rate limit exceeded (HTTP 429). "
                "Apply exponential back-off before retrying."
            )
        if response.status_code != 200:
            raise NvidiaClientError(
                f"NVIDIA API returned unexpected status {response.status_code}"
            )

        # Parse response body.
        try:
            body = response.json()
        except Exception as exc:
            raise NvidiaResponseError(
                f"NVIDIA API returned a non-JSON response: {exc}"
            ) from exc

        # Extract the assistant reply.
        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise NvidiaResponseError(
                f"NVIDIA API response missing expected fields (choices[0].message.content): {exc}"
            ) from exc

        if not isinstance(content, str):
            raise NvidiaResponseError(
                f"NVIDIA API 'content' field is not a string (got {type(content).__name__})"
            )

        logger.debug("NVIDIA chat reply received: length=%d", len(content))
        return content
