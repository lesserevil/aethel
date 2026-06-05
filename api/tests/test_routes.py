"""Integration tests for the Aethel backend chat service routes.

Uses ``httpx`` + ``TestClient`` so no real server process is needed.
No real NVIDIA key is required — the chat endpoint is tested in both
the "key configured" and "key not configured" states via monkeypatching.

Provider routing:
- Default (mock): returns stub, no NVIDIA call, no key required.
- AETHEL_CHAT_PROVIDER=nvidia: calls NvidiaClient, key required.
"""

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.nvidia_client import (
    NvidiaAuthError,
    NvidiaClientError,
    NvidiaRateLimitError,
    NvidiaResponseError,
    NvidiaTimeoutError,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_VALID_CHAT_BODY = {
    "sessionId": "test-session-001",
    "userMessage": "Hello, Aethel!",
    "agentState": {
        "id": "agent-1",
        "displayName": "Aethel",
        "personaPreset": "helpful",
        "tone": "friendly",
        "behavior": {
            "curiosity": 0.7,
            "formality": 0.5,
            "skepticism": 0.3,
        },
        "appearance": {
            "avatarPreset": "robot",
            "accentColor": "#76b900",
            "idlePose": "standing",
        },
    },
    "environmentState": {
        "preset": "office",
        "timeOfDay": "afternoon",
        "lighting": "bright",
        "ambience": "quiet",
        "weather": "clear",
        "objects": [],
    },
    "recentMessages": [
        {
            "id": "msg-0",
            "content": "Hello",
            "timestamp": 1717600000000,
            "sender": "user",
        }
    ],
}


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "nvidia_key_configured" in data


def test_health_nvidia_key_not_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When no key is available, health still returns 200 with the flag False."""
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["nvidia_key_configured"] is False


def test_health_nvidia_key_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["nvidia_key_configured"] is True


def test_health_response_does_not_contain_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Health response body must never contain an API key value."""
    import api.main as main_module

    monkeypatch.setenv("NVIDIA_API_KEY", "sk-SuperSecret123456789")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    response = client.get("/api/health")
    body_text = response.text
    assert "sk-SuperSecret123456789" not in body_text


# ---------------------------------------------------------------------------
# POST /api/chat
# ---------------------------------------------------------------------------


def test_chat_placeholder_response(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A valid request with a key configured returns 200 with a stub response."""
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "newMessageId" in data
    assert data["newMessageId"].startswith("api-")


def test_chat_stub_response_contains_agent_name(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert "Aethel" in response.json()["response"]


def test_chat_503_when_key_not_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When NVIDIA provider is selected but no key is configured, return 503."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert response.status_code == 503
    detail = response.json().get("detail", "")
    # Error message should guide user — must not contain a key value.
    assert "NVIDIA_API_KEY" in detail or "netrc" in detail.lower()


def test_chat_503_error_does_not_leak_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Even when a key is present in the environment, the 503 error must not echo it."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setenv("NVIDIA_API_KEY", "sk-DoNotLeakThis99")
    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert "sk-DoNotLeakThis99" not in response.text


def test_chat_mock_provider_returns_200_without_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Mock provider (default) returns 200 even when no NVIDIA key is available."""
    import api.main as main_module

    # Explicitly set mock mode (or leave unset — same result)
    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "mock")
    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "newMessageId" in data


def test_chat_default_provider_is_mock(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When AETHEL_CHAT_PROVIDER is unset, mock mode is the default."""
    import api.main as main_module

    monkeypatch.delenv("AETHEL_CHAT_PROVIDER", raising=False)
    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# POST /api/chat — request validation
# ---------------------------------------------------------------------------


def test_chat_missing_session_id(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY}
    del body["sessionId"]
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_empty_session_id(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY, "sessionId": ""}
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_missing_user_message(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY}
    del body["userMessage"]
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_empty_user_message(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY, "userMessage": ""}
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_missing_agent_state(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY}
    del body["agentState"]
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_missing_environment_state(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {**_VALID_CHAT_BODY}
    del body["environmentState"]
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_invalid_behavior_values(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Behavior sliders out of 0–1 range must be rejected."""
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {
        **_VALID_CHAT_BODY,
        "agentState": {
            **_VALID_CHAT_BODY["agentState"],
            "behavior": {"curiosity": 2.0, "formality": -1.0, "skepticism": 0.5},
        },
    }
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_invalid_sender(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Messages with unknown sender types must be rejected."""
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    body = {
        **_VALID_CHAT_BODY,
        "recentMessages": [
            {
                "id": "msg-x",
                "content": "Hi",
                "timestamp": 1717600000000,
                "sender": "robot",  # invalid
            }
        ],
    }
    response = client.post("/api/chat", json=body)
    assert response.status_code == 422


def test_chat_response_does_not_contain_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The /api/chat response body must never contain a key value."""
    import api.main as main_module

    monkeypatch.setenv("NVIDIA_API_KEY", "sk-NeverReturnThisKey99")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert "sk-NeverReturnThisKey99" not in response.text


def test_chat_each_response_has_unique_message_id(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    import api.main as main_module

    monkeypatch.setattr(main_module, "key_is_available", lambda: True)
    ids = {
        client.post("/api/chat", json=_VALID_CHAT_BODY).json()["newMessageId"]
        for _ in range(5)
    }
    # All 5 responses must have distinct IDs.
    assert len(ids) == 5


# ---------------------------------------------------------------------------
# POST /api/chat — NVIDIA provider path (mocked HTTP)
# ---------------------------------------------------------------------------


def _nvidia_success_response(reply: str = "Hello from Nemotron!") -> httpx.Response:
    body = json.dumps(
        {
            "choices": [
                {"message": {"role": "assistant", "content": reply}, "finish_reason": "stop"}
            ]
        }
    ).encode()
    return httpx.Response(200, content=body, headers={"content-type": "application/json"})


def test_nvidia_provider_returns_model_reply(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NVIDIA provider path returns the model reply in ChatResponse.response."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    mock_resp = _nvidia_success_response("Hi there, from Nemotron!")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == "Hi there, from Nemotron!"
    assert data["newMessageId"].startswith("api-")


def test_nvidia_provider_response_does_not_leak_key(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NVIDIA provider response must not contain the API key."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setenv("NVIDIA_API_KEY", "sk-RouteSecretKey42")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    mock_resp = _nvidia_success_response("OK")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert "sk-RouteSecretKey42" not in response.text


def test_nvidia_provider_auth_error_returns_502(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NvidiaAuthError from the client is mapped to HTTP 502."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    with patch(
        "api.main.NvidiaClient.chat",
        new_callable=AsyncMock,
        side_effect=NvidiaAuthError("bad key"),
    ):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 502
    assert "authentication" in response.json()["detail"].lower()


def test_nvidia_provider_rate_limit_returns_429(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NvidiaRateLimitError from the client is mapped to HTTP 429."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    with patch(
        "api.main.NvidiaClient.chat",
        new_callable=AsyncMock,
        side_effect=NvidiaRateLimitError("rate limit"),
    ):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()


def test_nvidia_provider_timeout_returns_504(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NvidiaTimeoutError from the client is mapped to HTTP 504."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    with patch(
        "api.main.NvidiaClient.chat",
        new_callable=AsyncMock,
        side_effect=NvidiaTimeoutError("timed out"),
    ):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()


def test_nvidia_provider_response_error_returns_502(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """NvidiaResponseError from the client is mapped to HTTP 502."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    with patch(
        "api.main.NvidiaClient.chat",
        new_callable=AsyncMock,
        side_effect=NvidiaResponseError("malformed"),
    ):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 502
    assert "unexpected" in response.json()["detail"].lower()


def test_nvidia_provider_generic_client_error_returns_502(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Generic NvidiaClientError from the client is mapped to HTTP 502."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    with patch(
        "api.main.NvidiaClient.chat",
        new_callable=AsyncMock,
        side_effect=NvidiaClientError("transport error"),
    ):
        response = client.post("/api/chat", json=_VALID_CHAT_BODY)

    assert response.status_code == 502


def test_nvidia_provider_reply_id_unique_across_requests(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Each NVIDIA provider response has a unique message ID."""
    import api.main as main_module

    monkeypatch.setenv("AETHEL_CHAT_PROVIDER", "nvidia")
    monkeypatch.setattr(main_module, "key_is_available", lambda: True)

    mock_resp = _nvidia_success_response("reply")
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        ids = {
            client.post("/api/chat", json=_VALID_CHAT_BODY).json()["newMessageId"]
            for _ in range(3)
        }
    assert len(ids) == 3
