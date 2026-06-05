"""Pydantic models for the Aethel backend chat service.

These models mirror the TypeScript interfaces in
``web/src/services/chatAdapter.ts`` and ``web/src/state/sessionTypes.ts``.
Keep both in sync when the contract changes.
"""

from typing import Literal, Optional

from pydantic import BaseModel, Field


# ── Nested state models ────────────────────────────────────────────────────────


class BehaviorState(BaseModel):
    """Agent behavior sliders (0–1 scale)."""

    curiosity: float = Field(ge=0, le=1)
    formality: float = Field(ge=0, le=1)
    skepticism: float = Field(ge=0, le=1)


class AgentAppearance(BaseModel):
    avatarPreset: str
    accentColor: str
    idlePose: str


class AgentState(BaseModel):
    id: str
    displayName: str
    personaPreset: str
    tone: str
    behavior: BehaviorState
    appearance: AgentAppearance


class EnvironmentState(BaseModel):
    preset: str
    timeOfDay: str
    lighting: str
    ambience: str
    weather: str
    # objects is intentionally left as a free-form list for the scaffold;
    # a later task will add typed SceneObjectState entries.
    objects: list = Field(default_factory=list)
    # selectedObject is the currently focused scene object, if any.
    selectedObject: Optional[str] = None


class ChatMessageMetadata(BaseModel):
    agentId: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)


class ChatMessage(BaseModel):
    id: str
    content: str
    timestamp: int  # Unix timestamp in milliseconds
    sender: Literal["user", "agent", "system"]
    metadata: Optional[ChatMessageMetadata] = None


# ── Request / response ─────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """Inbound request to ``POST /api/chat``.

    Mirrors :js:`ChatRequest` in ``web/src/services/chatAdapter.ts``.
    """

    sessionId: str = Field(min_length=1)
    userMessage: str = Field(min_length=1)
    agentState: AgentState
    environmentState: EnvironmentState
    recentMessages: list[ChatMessage]


class ChatResponse(BaseModel):
    """Outbound response from ``POST /api/chat``.

    Mirrors :js:`ChatResponse` in ``web/src/services/chatAdapter.ts``.
    """

    response: str
    newMessageId: str


# ── Health ─────────────────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    nvidia_key_configured: bool
