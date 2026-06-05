// License: MIT
//
// Copyright (c) 2026 <your-organization>
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
//

import type { ChatAdapter, ChatRequest, ChatResponse } from "./chatAdapter";
import { ChatError } from "./chatAdapter";

/**
 * API-backed chat adapter.
 *
 * Posts the existing {@link ChatRequest} shape to `/api/chat` and maps the
 * backend response to {@link ChatResponse}.
 *
 * The backend is responsible for all provider credentials (NVIDIA API key,
 * model selection, etc.). No credentials are required by this adapter.
 *
 * Error handling:
 * - Abort signal: throws {@link ChatError} with "Request aborted".
 * - Network failure: throws {@link ChatError} with "Network error: <message>".
 * - Non-OK HTTP response: throws {@link ChatError} with the backend error
 *   detail if available, otherwise the HTTP status and status text.
 * - Malformed JSON response: throws {@link ChatError}.
 */
export const apiChatAdapter: ChatAdapter = {
  async send(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    // Check abort before making the network call.
    if (signal?.aborted) {
      throw new ChatError("Request aborted");
    }

    let response: Response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });
    } catch (err) {
      // fetch() throws DOMException with name "AbortError" when aborted.
      if (
        (err instanceof DOMException && err.name === "AbortError") ||
        (err instanceof Error && err.name === "AbortError")
      ) {
        throw new ChatError("Request aborted");
      }
      const message = err instanceof Error ? err.message : "Unknown network error";
      throw new ChatError(`Network error: ${message}`);
    }

    if (!response.ok) {
      // Attempt to extract a human-readable error from the response body.
      let errorMessage = `Backend error: ${response.status} ${response.statusText}`;
      try {
        const body = (await response.json()) as Record<string, unknown>;
        if (typeof body["detail"] === "string") {
          errorMessage = body["detail"];
        } else if (typeof body["error"] === "string") {
          errorMessage = body["error"];
        }
      } catch {
        // Ignore JSON parse errors on error responses; use the HTTP status message.
      }
      throw new ChatError(errorMessage);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ChatError("Invalid response from backend: failed to parse JSON");
    }

    // Validate the response shape matches ChatResponse.
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as Record<string, unknown>)["response"] !== "string" ||
      typeof (data as Record<string, unknown>)["newMessageId"] !== "string"
    ) {
      throw new ChatError("Invalid response from backend: unexpected shape");
    }

    return data as ChatResponse;
  },
};
