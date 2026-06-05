"""Aethel backend chat service.

Endpoints
---------
GET  /api/health  – liveness check; reports whether an NVIDIA key is configured.
POST /api/chat    – chat endpoint.  Routes to the NVIDIA Nemotron client when
                    ``AETHEL_CHAT_PROVIDER=nvidia``; falls back to a mock stub
                    otherwise (default).

Provider selection
------------------
Set the ``AETHEL_CHAT_PROVIDER`` environment variable:

- ``mock`` (default): return a deterministic stub response — no NVIDIA key needed.
- ``nvidia``: call the NVIDIA Nemotron model via the backend client.

Run with::

    uvicorn api.main:app --reload --port 8000

Or via make::

    make run-api
"""

import logging
import os
import uuid

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import NvidiaKeyNotFoundError, key_is_available
from .models import ChatRequest, ChatResponse, HealthResponse
from .nvidia_client import (
    NvidiaAuthError,
    NvidiaClient,
    NvidiaClientError,
    NvidiaRateLimitError,
    NvidiaResponseError,
    NvidiaTimeoutError,
)
from .prompt_builder import build_messages

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


# ── Provider helper ────────────────────────────────────────────────────────────


def _chat_provider() -> str:
    """Return the configured chat provider name (lower-cased).

    Reads ``AETHEL_CHAT_PROVIDER`` from the environment.
    Returns ``"mock"`` when the variable is unset or empty.
    """
    return os.environ.get("AETHEL_CHAT_PROVIDER", "mock").strip().lower()


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
    """Chat endpoint.

    Routes to the NVIDIA Nemotron model when ``AETHEL_CHAT_PROVIDER=nvidia``,
    or returns a deterministic stub when the provider is ``mock`` (default).

    Args:
        request: Validated chat request from the frontend.

    Returns:
        :class:`~api.models.ChatResponse` with the assistant reply and a new
        unique message ID.

    Raises:
        HTTP 503: NVIDIA provider selected but no API key configured.
        HTTP 429: NVIDIA API rate limit exceeded.
        HTTP 502: NVIDIA API authentication failure or malformed response.
        HTTP 504: NVIDIA API request timed out.
    """
    provider = _chat_provider()

    logger.info(
        "Chat request: provider=%s session=%s message_length=%d recent_messages=%d",
        provider,
        request.sessionId,
        len(request.userMessage),
        len(request.recentMessages),
    )

    # ── NVIDIA provider path ───────────────────────────────────────────────
    if provider == "nvidia":
        if not key_is_available():
            logger.warning(
                "Chat rejected: NVIDIA API key not configured (session=%s)",
                request.sessionId,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "NVIDIA API key is not configured.  "
                    "Set NVIDIA_API_KEY or add a ~/.netrc entry for "
                    "inference-api.nvidia.com."
                ),
            )

        messages = build_messages(request)
        client = NvidiaClient()

        try:
            reply = await client.chat(messages)
        except NvidiaAuthError as exc:
            logger.error("NVIDIA auth error (session=%s): %s", request.sessionId, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="NVIDIA API authentication failed. Check that the API key is valid.",
            ) from exc
        except NvidiaRateLimitError as exc:
            logger.warning("NVIDIA rate limit (session=%s): %s", request.sessionId, exc)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="NVIDIA API rate limit exceeded. Please try again shortly.",
            ) from exc
        except NvidiaTimeoutError as exc:
            logger.warning("NVIDIA timeout (session=%s): %s", request.sessionId, exc)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="NVIDIA API request timed out. Please try again.",
            ) from exc
        except (NvidiaResponseError, NvidiaClientError) as exc:
            logger.error("NVIDIA client error (session=%s): %s", request.sessionId, exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="NVIDIA API returned an unexpected response.",
            ) from exc

        new_message_id = f"api-{uuid.uuid4()}"
        logger.info(
            "Chat response sent: provider=nvidia session=%s new_message_id=%s",
            request.sessionId,
            new_message_id,
        )
        return ChatResponse(response=reply, newMessageId=new_message_id)

    # ── Mock / stub path (default) ─────────────────────────────────────────
    # Return a deterministic stub when no live provider is configured.
    # This keeps the app working during local development without an NVIDIA key.
    new_message_id = f"api-{uuid.uuid4()}"
    stub_response = (
        f"[stub] {request.agentState.displayName} received your message. "
        "Live NVIDIA model integration is available when AETHEL_CHAT_PROVIDER=nvidia."
    )

    logger.info(
        "Chat stub response: provider=mock session=%s new_message_id=%s",
        request.sessionId,
        new_message_id,
    )

    return ChatResponse(
        response=stub_response,
        newMessageId=new_message_id,
    )
