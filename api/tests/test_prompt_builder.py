"""Unit tests for api/prompt_builder.py.

Verifies that agent and environment context is always included in the
built prompt, that omitting required fields raises ValueError, that
recent history is bounded, and that sender roles map correctly.
"""

import pytest

from api.models import (
    AgentAppearance,
    AgentState,
    BehaviorState,
    ChatMessage,
    ChatRequest,
    EnvironmentState,
)
from api.prompt_builder import (
    MAX_HISTORY_MESSAGES,
    build_messages,
    build_system_prompt,
)

# ── Fixtures ──────────────────────────────────────────────────────────────────

_BEHAVIOR = BehaviorState(curiosity=0.7, formality=0.5, skepticism=0.3)
_APPEARANCE = AgentAppearance(
    avatarPreset="robot",
    accentColor="#76b900",
    idlePose="standing",
)


def _make_agent(
    display_name: str = "Aethel",
    persona: str = "helpful-assistant",
    tone: str = "friendly",
    behavior: BehaviorState = _BEHAVIOR,
) -> AgentState:
    return AgentState(
        id="agent-1",
        displayName=display_name,
        personaPreset=persona,
        tone=tone,
        behavior=behavior,
        appearance=_APPEARANCE,
    )


def _make_env(
    preset: str = "office",
    time_of_day: str = "afternoon",
    lighting: str = "bright",
    ambience: str = "quiet",
    weather: str = "clear",
    objects: list | None = None,
    selected_object: str | None = None,
) -> EnvironmentState:
    return EnvironmentState(
        preset=preset,
        timeOfDay=time_of_day,
        lighting=lighting,
        ambience=ambience,
        weather=weather,
        objects=objects or [],
        selectedObject=selected_object,
    )


def _make_request(
    agent: AgentState | None = None,
    env: EnvironmentState | None = None,
    recent_messages: list[ChatMessage] | None = None,
    user_message: str = "Hello!",
) -> ChatRequest:
    return ChatRequest(
        sessionId="test-session",
        userMessage=user_message,
        agentState=agent or _make_agent(),
        environmentState=env or _make_env(),
        recentMessages=recent_messages or [],
    )


def _make_chat_msg(
    idx: int, sender: str = "user", content: str | None = None
) -> ChatMessage:
    return ChatMessage(
        id=f"msg-{idx}",
        content=content or f"message {idx}",
        timestamp=1717600000000 + idx * 1000,
        sender=sender,  # type: ignore[arg-type]
    )


# ── build_system_prompt — context inclusion ───────────────────────────────────


def test_system_prompt_contains_agent_display_name() -> None:
    """System prompt must include the agent display name."""
    prompt = build_system_prompt(_make_agent(display_name="Nova"), _make_env())
    assert "Nova" in prompt


def test_system_prompt_contains_persona_preset() -> None:
    """System prompt must include the agent persona preset."""
    prompt = build_system_prompt(_make_agent(persona="curious-explorer"), _make_env())
    assert "curious-explorer" in prompt


def test_system_prompt_contains_tone() -> None:
    """System prompt must include the agent tone."""
    prompt = build_system_prompt(_make_agent(tone="professional"), _make_env())
    assert "professional" in prompt


def test_system_prompt_contains_behavior_values() -> None:
    """System prompt must include behavior slider values."""
    behavior = BehaviorState(curiosity=0.8, formality=0.2, skepticism=0.6)
    prompt = build_system_prompt(_make_agent(behavior=behavior), _make_env())
    assert "80%" in prompt  # curiosity 0.8 = 80%
    assert "20%" in prompt  # formality
    assert "60%" in prompt  # skepticism


def test_system_prompt_contains_environment_preset() -> None:
    """System prompt must include the environment preset."""
    prompt = build_system_prompt(_make_agent(), _make_env(preset="rooftop-terrace"))
    assert "rooftop-terrace" in prompt


def test_system_prompt_contains_time_of_day() -> None:
    """System prompt must include the time of day."""
    prompt = build_system_prompt(_make_agent(), _make_env(time_of_day="midnight"))
    assert "midnight" in prompt


def test_system_prompt_contains_lighting() -> None:
    """System prompt must include the lighting setting."""
    prompt = build_system_prompt(_make_agent(), _make_env(lighting="neon"))
    assert "neon" in prompt


def test_system_prompt_contains_ambience() -> None:
    """System prompt must include the ambience setting."""
    prompt = build_system_prompt(_make_agent(), _make_env(ambience="bustling"))
    assert "bustling" in prompt


def test_system_prompt_contains_objects_list() -> None:
    """System prompt must include enabled office objects."""
    env = _make_env(objects=["desk", "whiteboard", "coffee-machine"])
    prompt = build_system_prompt(_make_agent(), env)
    assert "desk" in prompt
    assert "whiteboard" in prompt
    assert "coffee-machine" in prompt


def test_system_prompt_no_objects_shows_none() -> None:
    """When no objects are present, prompt indicates 'none'."""
    env = _make_env(objects=[])
    prompt = build_system_prompt(_make_agent(), env)
    assert "none" in prompt.lower()


def test_system_prompt_contains_selected_object_when_present() -> None:
    """System prompt must include the selected object when set."""
    env = _make_env(selected_object="holographic-globe")
    prompt = build_system_prompt(_make_agent(), env)
    assert "holographic-globe" in prompt


def test_system_prompt_no_selected_object_line_when_absent() -> None:
    """When selectedObject is None, 'Selected object:' must not appear."""
    env = _make_env(selected_object=None)
    prompt = build_system_prompt(_make_agent(), env)
    assert "Selected object:" not in prompt


# ── build_system_prompt — required field validation ───────────────────────────


def test_system_prompt_fails_without_display_name() -> None:
    """Empty displayName must raise ValueError — agent context is required."""
    agent = _make_agent(display_name="")
    with pytest.raises(ValueError, match="displayName"):
        build_system_prompt(agent, _make_env())


def test_system_prompt_fails_with_whitespace_only_display_name() -> None:
    """Whitespace-only displayName must raise ValueError."""
    agent = _make_agent(display_name="   ")
    with pytest.raises(ValueError, match="displayName"):
        build_system_prompt(agent, _make_env())


def test_system_prompt_fails_without_environment_preset() -> None:
    """Empty environment preset must raise ValueError — env context is required."""
    env = _make_env(preset="")
    with pytest.raises(ValueError, match="preset"):
        build_system_prompt(_make_agent(), env)


def test_system_prompt_fails_with_whitespace_only_preset() -> None:
    """Whitespace-only preset must raise ValueError."""
    env = _make_env(preset="   ")
    with pytest.raises(ValueError, match="preset"):
        build_system_prompt(_make_agent(), env)


# ── build_messages — structure ────────────────────────────────────────────────


def test_build_messages_first_message_is_system() -> None:
    """First message in the list must have role 'system'."""
    msgs = build_messages(_make_request())
    assert msgs[0]["role"] == "system"


def test_build_messages_system_content_not_empty() -> None:
    """System message content must not be empty."""
    msgs = build_messages(_make_request())
    assert len(msgs[0]["content"]) > 0


def test_build_messages_last_message_is_user() -> None:
    """Last message must have role 'user' and match the userMessage."""
    request = _make_request(user_message="What is on my desk?")
    msgs = build_messages(request)
    assert msgs[-1]["role"] == "user"
    assert msgs[-1]["content"] == "What is on my desk?"


def test_build_messages_includes_history() -> None:
    """Recent messages are included between the system message and user message."""
    history = [
        _make_chat_msg(0, sender="user", content="First question"),
        _make_chat_msg(1, sender="agent", content="First answer"),
    ]
    request = _make_request(recent_messages=history)
    msgs = build_messages(request)
    # system + 2 history + current user = 4
    assert len(msgs) == 4
    assert msgs[1]["content"] == "First question"
    assert msgs[2]["content"] == "First answer"


def test_build_messages_no_history_has_two_messages() -> None:
    """With no history, result is [system, user]."""
    request = _make_request(recent_messages=[])
    msgs = build_messages(request)
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"


def test_build_messages_history_bounded_to_max() -> None:
    """History beyond MAX_HISTORY_MESSAGES is truncated (oldest dropped)."""
    long_history = [_make_chat_msg(i, sender="user") for i in range(MAX_HISTORY_MESSAGES + 10)]
    request = _make_request(recent_messages=long_history)
    msgs = build_messages(request)
    # system + MAX_HISTORY + current user
    assert len(msgs) == MAX_HISTORY_MESSAGES + 2


def test_build_messages_history_keeps_most_recent() -> None:
    """When truncated, the most recent messages are kept."""
    long_history = [
        _make_chat_msg(i, sender="user", content=f"msg-{i}") for i in range(MAX_HISTORY_MESSAGES + 5)
    ]
    request = _make_request(recent_messages=long_history)
    msgs = build_messages(request)
    # The second message (after system) should be msg-5 (oldest retained)
    assert msgs[1]["content"] == f"msg-{5}"


# ── build_messages — sender role mapping ─────────────────────────────────────


def test_user_sender_maps_to_user_role() -> None:
    """Messages with sender='user' map to role='user'."""
    history = [_make_chat_msg(0, sender="user", content="User message")]
    msgs = build_messages(_make_request(recent_messages=history))
    assert msgs[1]["role"] == "user"


def test_agent_sender_maps_to_assistant_role() -> None:
    """Messages with sender='agent' map to role='assistant'."""
    history = [_make_chat_msg(0, sender="agent", content="Agent reply")]
    msgs = build_messages(_make_request(recent_messages=history))
    assert msgs[1]["role"] == "assistant"


def test_system_sender_maps_to_assistant_role() -> None:
    """Messages with sender='system' map to role='assistant'."""
    history = [_make_chat_msg(0, sender="system", content="System notice")]
    msgs = build_messages(_make_request(recent_messages=history))
    assert msgs[1]["role"] == "assistant"


# ── build_messages — context propagation ─────────────────────────────────────


def test_build_messages_system_contains_agent_name() -> None:
    """System message content must contain the agent display name."""
    agent = _make_agent(display_name="Zara")
    msgs = build_messages(_make_request(agent=agent))
    assert "Zara" in msgs[0]["content"]


def test_build_messages_system_contains_env_preset() -> None:
    """System message content must contain the environment preset."""
    env = _make_env(preset="penthouse-suite")
    msgs = build_messages(_make_request(env=env))
    assert "penthouse-suite" in msgs[0]["content"]


def test_build_messages_system_contains_selected_object() -> None:
    """System message must include selectedObject when set in the environment."""
    env = _make_env(selected_object="antique-clock")
    msgs = build_messages(_make_request(env=env))
    assert "antique-clock" in msgs[0]["content"]


def test_build_messages_fails_without_agent_display_name() -> None:
    """build_messages raises ValueError when agent displayName is empty."""
    agent = _make_agent(display_name="")
    with pytest.raises(ValueError, match="displayName"):
        build_messages(_make_request(agent=agent))


def test_build_messages_fails_without_environment_preset() -> None:
    """build_messages raises ValueError when environment preset is empty."""
    env = _make_env(preset="")
    with pytest.raises(ValueError, match="preset"):
        build_messages(_make_request(env=env))
