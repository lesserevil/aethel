"""Unit tests for api/nvidia_client.py.

All HTTP calls are mocked — no real NVIDIA network access required.
Tests cover: success, 401/403, 429, timeout, cancellation, malformed
responses, missing fields, and credential resolution.
"""

import asyncio
import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from api.config import NvidiaKeyNotFoundError
from api.nvidia_client import (
    DEFAULT_NVIDIA_MODEL,
    AudioUrlContent,
    ImageUrlContent,
    NvidiaAuthError,
    NvidiaClient,
    NvidiaClientError,
    NvidiaRateLimitError,
    NvidiaResponseError,
    NvidiaTimeoutError,
    TextContent,
    VideoUrlContent,
)

# ── Helpers ───────────────────────────────────────────────────────────────────

_FAKE_KEY = "sk-FakeTestKeyForNvidiaClient"
_MESSAGES = [
    {"role": "system", "content": "You are Aethel."},
    {"role": "user", "content": "Hello!"},
]


def _make_response(status_code: int, body: Any) -> httpx.Response:
    """Build a mock httpx.Response with the given status and JSON body."""
    content = json.dumps(body).encode()
    return httpx.Response(
        status_code=status_code,
        content=content,
        headers={"content-type": "application/json"},
    )


def _make_raw_response(status_code: int, content: bytes) -> httpx.Response:
    """Build a mock httpx.Response with raw bytes body (for non-JSON tests)."""
    return httpx.Response(
        status_code=status_code,
        content=content,
        headers={"content-type": "text/plain"},
    )


def _success_body(reply: str = "Hello from Nemotron!") -> dict:
    return {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": reply,
                },
                "finish_reason": "stop",
            }
        ],
        "model": DEFAULT_NVIDIA_MODEL,
    }


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture
def client() -> NvidiaClient:
    """Client with an explicit API key and a short timeout for tests."""
    return NvidiaClient(
        api_key=_FAKE_KEY,
        base_url="https://mock-nvidia.example.com/v1",
        timeout_seconds=5.0,
    )


# ── Success path ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_success_returns_reply(client: NvidiaClient) -> None:
    """A 200 response with a valid body returns the assistant reply text."""
    mock_response = _make_response(200, _success_body("Hi there!"))
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await client.chat(_MESSAGES)
    assert result == "Hi there!"


@pytest.mark.asyncio
async def test_chat_success_strips_no_extra_whitespace(client: NvidiaClient) -> None:
    """Reply text is returned as-is without extra stripping."""
    mock_response = _make_response(200, _success_body("  trimmed  "))
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        result = await client.chat(_MESSAGES)
    assert result == "  trimmed  "


# ── Reasoning flag ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_reasoning_disabled_by_default(client: NvidiaClient) -> None:
    """When enable_reasoning=False (default), chat_template_kwargs is sent."""
    mock_response = _make_response(200, _success_body())
    captured: list[dict] = []

    async def _capture_post(url: str, *, json: dict, headers: dict, **kw: Any) -> httpx.Response:
        captured.append(json)
        return mock_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, side_effect=_capture_post):
        await client.chat(_MESSAGES)

    assert len(captured) == 1
    payload = captured[0]
    assert "chat_template_kwargs" in payload
    assert payload["chat_template_kwargs"] == {"thinking": False}


@pytest.mark.asyncio
async def test_chat_reasoning_enabled_omits_template_kwargs(client: NvidiaClient) -> None:
    """When enable_reasoning=True, chat_template_kwargs is NOT sent."""
    mock_response = _make_response(200, _success_body())
    captured: list[dict] = []

    async def _capture_post(url: str, *, json: dict, headers: dict, **kw: Any) -> httpx.Response:
        captured.append(json)
        return mock_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, side_effect=_capture_post):
        await client.chat(_MESSAGES, enable_reasoning=True)

    assert "chat_template_kwargs" not in captured[0]


@pytest.mark.asyncio
async def test_chat_payload_contains_model(client: NvidiaClient) -> None:
    """The model string is included in the request payload."""
    mock_response = _make_response(200, _success_body())
    captured: list[dict] = []

    async def _capture_post(url: str, *, json: dict, headers: dict, **kw: Any) -> httpx.Response:
        captured.append(json)
        return mock_response

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, side_effect=_capture_post):
        await client.chat(_MESSAGES)

    assert captured[0]["model"] == DEFAULT_NVIDIA_MODEL


@pytest.mark.asyncio
async def test_chat_authorization_header_not_logged(
    client: NvidiaClient, caplog: pytest.LogCaptureFixture
) -> None:
    """The Authorization header value must never appear in log output."""
    mock_response = _make_response(200, _success_body())
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with caplog.at_level("DEBUG", logger="api.nvidia_client"):
            await client.chat(_MESSAGES)
    assert _FAKE_KEY not in caplog.text


# ── HTTP error responses ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_401_raises_auth_error(client: NvidiaClient) -> None:
    """HTTP 401 must raise NvidiaAuthError."""
    mock_response = _make_response(401, {"error": "Unauthorized"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaAuthError) as exc_info:
            await client.chat(_MESSAGES)
    assert "401" in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_403_raises_auth_error(client: NvidiaClient) -> None:
    """HTTP 403 must raise NvidiaAuthError."""
    mock_response = _make_response(403, {"error": "Forbidden"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaAuthError) as exc_info:
            await client.chat(_MESSAGES)
    assert "403" in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_auth_error_does_not_leak_key(
    client: NvidiaClient, caplog: pytest.LogCaptureFixture
) -> None:
    """NvidiaAuthError message must not contain the API key."""
    mock_response = _make_response(401, {"error": "bad key"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaAuthError) as exc_info:
            await client.chat(_MESSAGES)
    assert _FAKE_KEY not in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_429_raises_rate_limit_error(client: NvidiaClient) -> None:
    """HTTP 429 must raise NvidiaRateLimitError."""
    mock_response = _make_response(429, {"error": "Too Many Requests"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaRateLimitError) as exc_info:
            await client.chat(_MESSAGES)
    assert "429" in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_500_raises_client_error(client: NvidiaClient) -> None:
    """Non-200/401/403/429 status codes raise NvidiaClientError."""
    mock_response = _make_response(500, {"error": "Internal Server Error"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaClientError) as exc_info:
            await client.chat(_MESSAGES)
    assert "500" in str(exc_info.value)


@pytest.mark.asyncio
async def test_chat_503_raises_client_error(client: NvidiaClient) -> None:
    """503 from NVIDIA raises NvidiaClientError."""
    mock_response = _make_response(503, {"error": "Service Unavailable"})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaClientError):
            await client.chat(_MESSAGES)


# ── Timeout and cancellation ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_timeout_raises_timeout_error(client: NvidiaClient) -> None:
    """httpx.TimeoutException is wrapped in NvidiaTimeoutError."""
    with patch(
        "httpx.AsyncClient.post",
        new_callable=AsyncMock,
        side_effect=httpx.TimeoutException("timed out"),
    ):
        with pytest.raises(NvidiaTimeoutError) as exc_info:
            await client.chat(_MESSAGES)
    assert "timed out" in str(exc_info.value).lower() or "timeout" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_chat_connect_timeout_raises_timeout_error(client: NvidiaClient) -> None:
    """httpx.ConnectTimeout (subclass of TimeoutException) also raises NvidiaTimeoutError."""
    with patch(
        "httpx.AsyncClient.post",
        new_callable=AsyncMock,
        side_effect=httpx.ConnectTimeout("connect timed out"),
    ):
        with pytest.raises(NvidiaTimeoutError):
            await client.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_cancelled_raises_timeout_error(client: NvidiaClient) -> None:
    """asyncio.CancelledError is wrapped in NvidiaTimeoutError (not propagated raw)."""
    with patch(
        "httpx.AsyncClient.post",
        new_callable=AsyncMock,
        side_effect=asyncio.CancelledError(),
    ):
        with pytest.raises(NvidiaTimeoutError) as exc_info:
            await client.chat(_MESSAGES)
    assert "cancelled" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_chat_http_error_raises_client_error(client: NvidiaClient) -> None:
    """Transport-level httpx.HTTPError (e.g. network failure) raises NvidiaClientError."""
    with patch(
        "httpx.AsyncClient.post",
        new_callable=AsyncMock,
        side_effect=httpx.HTTPError("connection refused"),
    ):
        with pytest.raises(NvidiaClientError) as exc_info:
            await client.chat(_MESSAGES)
    assert "connection refused" in str(exc_info.value).lower()


# ── Malformed / missing response fields ──────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_non_json_response_raises_response_error(client: NvidiaClient) -> None:
    """Non-JSON response body raises NvidiaResponseError."""
    mock_response = _make_raw_response(200, b"not valid json {{{")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError) as exc_info:
            await client.chat(_MESSAGES)
    assert "non-json" in str(exc_info.value).lower() or "json" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_chat_empty_choices_raises_response_error(client: NvidiaClient) -> None:
    """Empty 'choices' list raises NvidiaResponseError."""
    mock_response = _make_response(200, {"choices": []})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError):
            await client.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_missing_choices_key_raises_response_error(client: NvidiaClient) -> None:
    """Response missing 'choices' key raises NvidiaResponseError."""
    mock_response = _make_response(200, {"model": DEFAULT_NVIDIA_MODEL})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError):
            await client.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_missing_message_key_raises_response_error(client: NvidiaClient) -> None:
    """Choice entry missing 'message' key raises NvidiaResponseError."""
    mock_response = _make_response(200, {"choices": [{"finish_reason": "stop"}]})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError):
            await client.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_missing_content_key_raises_response_error(client: NvidiaClient) -> None:
    """Message missing 'content' key raises NvidiaResponseError."""
    mock_response = _make_response(200, {"choices": [{"message": {"role": "assistant"}}]})
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError):
            await client.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_non_string_content_raises_response_error(client: NvidiaClient) -> None:
    """Non-string 'content' field raises NvidiaResponseError."""
    mock_response = _make_response(
        200,
        {"choices": [{"message": {"role": "assistant", "content": 42}}]},
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with pytest.raises(NvidiaResponseError) as exc_info:
            await client.chat(_MESSAGES)
    assert "int" in str(exc_info.value).lower() or "string" in str(exc_info.value).lower()


# ── Credential resolution ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_chat_no_key_configured_raises_auth_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When no API key is resolvable, chat raises NvidiaAuthError before calling the API."""
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    client_no_key = NvidiaClient(
        base_url="https://mock-nvidia.example.com/v1",
        timeout_seconds=5.0,
    )
    # Patch load_nvidia_api_key to raise NvidiaKeyNotFoundError without touching filesystem.
    with patch(
        "api.nvidia_client.load_nvidia_api_key",
        side_effect=NvidiaKeyNotFoundError("no key configured"),
    ):
        with pytest.raises(NvidiaAuthError):
            await client_no_key.chat(_MESSAGES)


@pytest.mark.asyncio
async def test_chat_uses_env_key_implicitly(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Client without explicit key resolves from environment variable."""
    monkeypatch.setenv("NVIDIA_API_KEY", _FAKE_KEY)
    captured_headers: list[dict] = []

    mock_response = _make_response(200, _success_body())

    async def _capture_post(url: str, *, json: dict, headers: dict, **kw: Any) -> httpx.Response:
        captured_headers.append(headers)
        return mock_response

    client_env = NvidiaClient(
        base_url="https://mock-nvidia.example.com/v1",
        timeout_seconds=5.0,
    )
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, side_effect=_capture_post):
        await client_env.chat(_MESSAGES)

    assert len(captured_headers) == 1
    assert captured_headers[0]["Authorization"] == f"Bearer {_FAKE_KEY}"


# ── Multimodal extension type assertions ──────────────────────────────────────


def test_text_content_type() -> None:
    """TextContent Pydantic model parses correctly."""
    tc = TextContent(text="hello")
    assert tc.type == "text"
    assert tc.text == "hello"


def test_image_url_content_type() -> None:
    """ImageUrlContent Pydantic model parses correctly."""
    ic = ImageUrlContent(image_url={"url": "data:image/png;base64,abc"})
    assert ic.type == "image_url"
    assert "url" in ic.image_url


def test_audio_url_content_type() -> None:
    """AudioUrlContent Pydantic model parses correctly."""
    ac = AudioUrlContent(audio_url={"url": "https://example.com/audio.wav"})
    assert ac.type == "audio_url"


def test_video_url_content_type() -> None:
    """VideoUrlContent Pydantic model parses correctly."""
    vc = VideoUrlContent(video_url={"url": "https://example.com/video.mp4"})
    assert vc.type == "video_url"
