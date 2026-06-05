// apiChatAdapter.test.ts
// Tests for the API-backed chat adapter.
//
// All network calls are intercepted with vi.stubGlobal("fetch", ...) so
// no real HTTP requests are made. Covers:
//  1. Successful backend response → ChatResponse
//  2. Backend error response (non-2xx) with detail field
//  3. Backend error response (non-2xx) with error field
//  4. Backend error response (non-2xx) with no parseable body
//  5. Network failure (fetch throws)
//  6. Abort before fetch begins
//  7. Abort during fetch (fetch throws AbortError)
//  8. Malformed JSON in successful response
//  9. Response with unexpected shape (missing fields)
// 10. AbortSignal is forwarded to fetch

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiChatAdapter } from "./apiChatAdapter";
import { ChatError } from "./chatAdapter";
import type { ChatRequest } from "./chatAdapter";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<ChatRequest> = {}): ChatRequest {
  return {
    sessionId: "session-001",
    userMessage: "Hello API",
    agentState: {
      id: "agent-001",
      displayName: "TestAgent",
      personaPreset: "helpful",
      tone: "friendly",
      behavior: { curiosity: 0.5, formality: 0.3, skepticism: 0.1 },
      appearance: { avatarPreset: "robot", accentColor: "#fff", idlePose: "standing" },
    },
    environmentState: {
      preset: "office",
      timeOfDay: "afternoon",
      lighting: "bright",
      ambience: "quiet",
      weather: "clear",
      objects: [],
    },
    recentMessages: [
      { id: "msg-1", content: "Previous message", timestamp: 12345, sender: "user" },
    ],
    ...overrides,
  };
}

/** Create a minimal Response-like object accepted by the fetch stub. */
function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeErrorResponse(status: number, statusText: string, body?: unknown): Response {
  return {
    ok: false,
    status,
    statusText,
    json:
      body !== undefined
        ? () => Promise.resolve(body)
        : () => Promise.reject(new Error("not json")),
  } as unknown as Response;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("apiChatAdapter", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── 1. Successful response ─────────────────────────────────────────────────

  describe("successful backend response", () => {
    it("returns a ChatResponse with response and newMessageId", async () => {
      const expected = { response: "Hello from NVIDIA", newMessageId: "msg-api-001" };
      fetchSpy.mockResolvedValueOnce(makeOkResponse(expected));

      const result = await apiChatAdapter.send(makeRequest());

      expect(result.response).toBe("Hello from NVIDIA");
      expect(result.newMessageId).toBe("msg-api-001");
    });

    it("POSTs to /api/chat with correct Content-Type header", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeOkResponse({ response: "ok", newMessageId: "id-1" }),
      );

      await apiChatAdapter.send(makeRequest());

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/chat");
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
    });

    it("serializes the full ChatRequest as JSON body", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeOkResponse({ response: "ok", newMessageId: "id-2" }),
      );

      const request = makeRequest({ userMessage: "What's the weather?" });
      await apiChatAdapter.send(request);

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const parsed = JSON.parse(init.body as string) as ChatRequest;
      expect(parsed.sessionId).toBe("session-001");
      expect(parsed.userMessage).toBe("What's the weather?");
      expect(parsed.agentState.displayName).toBe("TestAgent");
    });
  });

  // ── 2. Backend error with detail field ────────────────────────────────────

  describe("backend error response with detail field", () => {
    it("throws ChatError with the backend detail message", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeErrorResponse(422, "Unprocessable Entity", {
          detail: "userMessage is too long",
        }),
      );

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe("userMessage is too long");
    });
  });

  // ── 3. Backend error with error field ─────────────────────────────────────

  describe("backend error response with error field", () => {
    it("throws ChatError with the backend error message", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeErrorResponse(503, "Service Unavailable", {
          error: "NVIDIA service temporarily unavailable",
        }),
      );

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe(
        "NVIDIA service temporarily unavailable",
      );
    });
  });

  // ── 4. Backend error with no parseable body ───────────────────────────────

  describe("backend error response with no parseable body", () => {
    it("throws ChatError with HTTP status and status text", async () => {
      fetchSpy.mockResolvedValueOnce(makeErrorResponse(500, "Internal Server Error"));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe(
        "Backend error: 500 Internal Server Error",
      );
    });

    it("throws a ChatError instance (not a plain Error)", async () => {
      fetchSpy.mockResolvedValueOnce(makeErrorResponse(502, "Bad Gateway"));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).name).toBe("ChatError");
    });
  });

  // ── 5. Network failure ────────────────────────────────────────────────────

  describe("network failure", () => {
    it("throws ChatError with a network error message when fetch rejects", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Failed to fetch"));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe("Network error: Failed to fetch");
    });

    it("throws a ChatError instance on network failure", async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError("net::ERR_CONNECTION_REFUSED"));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
    });
  });

  // ── 6. Abort before fetch begins ─────────────────────────────────────────

  describe("abort before fetch begins", () => {
    it("throws ChatError with 'Request aborted' when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest(), controller.signal);
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe("Request aborted");
      // fetch should not have been called because we check abort first.
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── 7. Abort during fetch ─────────────────────────────────────────────────

  describe("abort during fetch", () => {
    it("throws ChatError with 'Request aborted' when fetch throws DOMException AbortError", async () => {
      const abortError = new DOMException("The user aborted a request.", "AbortError");
      fetchSpy.mockRejectedValueOnce(abortError);

      const controller = new AbortController();
      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest(), controller.signal);
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe("Request aborted");
    });

    it("throws ChatError with 'Request aborted' when fetch throws an Error named AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      fetchSpy.mockRejectedValueOnce(abortError);

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe("Request aborted");
    });
  });

  // ── 8. Malformed JSON in successful response ──────────────────────────────

  describe("malformed JSON in successful response", () => {
    it("throws ChatError when the response body cannot be parsed as JSON", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      } as unknown as Response);

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe(
        "Invalid response from backend: failed to parse JSON",
      );
    });
  });

  // ── 9. Unexpected response shape ──────────────────────────────────────────

  describe("unexpected response shape", () => {
    it("throws ChatError when response is missing the response field", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeOkResponse({ newMessageId: "msg-001" }), // missing "response"
      );

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
      expect((caught as ChatError).message).toBe(
        "Invalid response from backend: unexpected shape",
      );
    });

    it("throws ChatError when response is missing the newMessageId field", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeOkResponse({ response: "Hello" }), // missing "newMessageId"
      );

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
    });

    it("throws ChatError when the response body is null", async () => {
      fetchSpy.mockResolvedValueOnce(makeOkResponse(null));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
    });

    it("throws ChatError when the response body is a plain string", async () => {
      fetchSpy.mockResolvedValueOnce(makeOkResponse("not an object"));

      let caught: unknown;
      try {
        await apiChatAdapter.send(makeRequest());
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(ChatError);
    });
  });

  // ── 10. Signal is passed to fetch ─────────────────────────────────────────

  describe("abort signal forwarding", () => {
    it("passes the AbortSignal to fetch", async () => {
      fetchSpy.mockResolvedValueOnce(
        makeOkResponse({ response: "ok", newMessageId: "id-3" }),
      );

      const controller = new AbortController();
      await apiChatAdapter.send(makeRequest(), controller.signal);

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(init.signal).toBe(controller.signal);
    });
  });
});
