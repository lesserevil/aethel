"""Aethel backend chat service.

Endpoints
---------
GET  /api/health  – liveness check; reports whether an NVIDIA key is configured.
POST /api/chat    – placeholder chat endpoint; validates the request shape but
                    does not call NVIDIA yet (see TASK-19.3 for the live client).

Run with:
    uvicorn api.main:app --reload --port 8000

Or via make:
    make run-api
"""

import logging
import uuid

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import NvidiaKeyNotFoundError, key_is_available
from .models import ChatRequest, ChatResponse, HealthResponse

# ── Logger setup ───────────────────────────────────────────────────────────────
# Use structurally safe log messages that never echo the NVIDIA key.

logger = logging.getLogger(__name__)

# ── Application ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Aethel Chat API",
    description=(
        "Backend chat service for Aethel.  Bridges the frontend ChatAdapter "
        "contract to NVIDIA model providers while keeping credentials server-side."
    ),
    version="0.1.0",
)

# Allow the Vite dev server (and any configured frontend origin) to reach the
# API during local development.  In production this should be locked down to
# the actual frontend origin via AETHEL_CORS_ORIGINS.
import os

_cors_origins = os.environ.get(
    "AETHEL_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ── Global exception handler ───────────────────────────────────────────────────


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all that logs without leaking internals to the client."""
    logger.exception("Unhandled exception processing %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ── Routes ─────────────────────────────────────────────────────────────────────


@app.get("/api/health", response_model=HealthResponse, tags=["operations"])
async def health() -> HealthResponse:
    """Liveness check.

    Returns ``{"status": "ok", "nvidia_key_configured": bool}``.  The boolean
    indicates whether an NVIDIA API key was resolved from the environment or
    ``~/.netrc``.  The key value itself is never included in the response.
    """
    configured = key_is_available()
    logger.info("Health check: nvidia_key_configured=%s", configured)
    return HealthResponse(nvidia_key_configured=configured)


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["chat"],
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Placeholder chat endpoint.

    Validates the full :class:`~api.models.ChatRequest` shape and returns a
    stub :class:`~api.models.ChatResponse`.  The live NVIDIA client is added in
    TASK-19.3; this endpoint exists to let the frontend ChatAdapter integration
    proceed without waiting for the model client.

    Raises HTTP 503 when an NVIDIA key is required but not configured.

    Args:
        request: Validated chat request from the frontend.

    Returns:
        A stub response containing the session ID echoed back as confirmation.
    """
    logger.info(
        "Chat request: session=%s message_length=%d recent_messages=%d",
        request.sessionId,
        len(request.userMessage),
        len(request.recentMessages),
    )

    # Surface a clear error when a real key will eventually be needed but is
    # absent.  This makes misconfiguration obvious during development.
    if not key_is_available():
        logger.warning("Chat request rejected: NVIDIA API key not configured (session=%s)", request.sessionId)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "NVIDIA API key is not configured.  "
                "Set NVIDIA_API_KEY or add a ~/.netrc entry for inference-api.nvidia.com."
            ),
        )

    # Placeholder response — real model call added in TASK-19.3.
    new_message_id = f"api-{uuid.uuid4()}"
    stub_response = (
        f"[stub] {request.agentState.displayName} received your message. "
        "Live NVIDIA model integration is pending (TASK-19.3)."
    )

    logger.info("Chat stub response: session=%s new_message_id=%s", request.sessionId, new_message_id)

    return ChatResponse(
        response=stub_response,
        newMessageId=new_message_id,
    )
