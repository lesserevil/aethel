"""Integration tests for the Aethel backend chat service routes.

Uses ``httpx`` + ``TestClient`` so no real server process is needed.
No real NVIDIA key is required — the chat endpoint is tested in both
the "key configured" and "key not configured" states via monkeypatching.
"""

import pytest
from fastapi.testclient import TestClient

from api.main import app

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
    """When no NVIDIA key is configured, /api/chat must return 503."""
    import api.main as main_module

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

    monkeypatch.setenv("NVIDIA_API_KEY", "sk-DoNotLeakThis99")
    monkeypatch.setattr(main_module, "key_is_available", lambda: False)
    response = client.post("/api/chat", json=_VALID_CHAT_BODY)
    assert "sk-DoNotLeakThis99" not in response.text


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
