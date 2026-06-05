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

import type { ChatAdapter } from "./chatAdapter";
import { mockChatAdapter } from "./chatAdapter";
import { apiChatAdapter } from "./apiChatAdapter";

/**
 * Chat provider identifier.
 *
 * - "mock": use the deterministic in-browser mock adapter (default).
 * - "api": use the API-backed adapter that forwards requests to `/api/chat`.
 */
export type ChatProvider = "mock" | "api";

/**
 * Returns the {@link ChatAdapter} selected by the configured provider.
 *
 * Provider selection:
 * 1. If `provider` argument is supplied, use it directly (useful for tests).
 * 2. Otherwise, read `import.meta.env.VITE_CHAT_PROVIDER` from the Vite
 *    build environment.  Set `VITE_CHAT_PROVIDER=api` in a local `.env`
 *    file to enable the backend API adapter.
 * 3. Default to "mock" when neither is set.
 *
 * Security note: `VITE_CHAT_PROVIDER` holds only the provider name ("mock"
 * or "api"), never an API key or token.  NVIDIA credentials are kept
 * server-side only — do not add them to any `VITE_*` variable.
 *
 * @param provider - Explicit provider override (skips env-var lookup).
 * @returns The selected {@link ChatAdapter} instance.
 */
export function getChatAdapter(provider?: ChatProvider): ChatAdapter {
  const selected: string =
    provider ?? (import.meta.env.VITE_CHAT_PROVIDER as string | undefined) ?? "mock";

  if (selected === "api") {
    return apiChatAdapter;
  }

  // Default: mock adapter — safe for offline development and tests.
  return mockChatAdapter;
}
