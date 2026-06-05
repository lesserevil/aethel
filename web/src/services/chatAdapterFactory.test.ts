// chatAdapterFactory.test.ts
// Tests for the chat adapter factory / provider selection mechanism.
//
// Covers:
//  1. Default (no env var) → returns mockChatAdapter
//  2. VITE_CHAT_PROVIDER=mock (explicit) → returns mockChatAdapter
//  3. VITE_CHAT_PROVIDER=api → returns apiChatAdapter
//  4. Unknown provider value → falls back to mockChatAdapter
//  5. Explicit provider argument takes precedence over env var

import { describe, it, expect, vi, afterEach } from "vitest";
import { getChatAdapter } from "./chatAdapterFactory";
import { mockChatAdapter } from "./chatAdapter";
import { apiChatAdapter } from "./apiChatAdapter";

describe("getChatAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("1. Default (no env var set)", () => {
    it("returns the mockChatAdapter when VITE_CHAT_PROVIDER is not set", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "");
      // getChatAdapter with no arg and empty env → mock
      const adapter = getChatAdapter();
      expect(adapter).toBe(mockChatAdapter);
    });
  });

  describe("2. Explicit mock provider argument", () => {
    it("returns mockChatAdapter when called with 'mock'", () => {
      const adapter = getChatAdapter("mock");
      expect(adapter).toBe(mockChatAdapter);
    });
  });

  describe("3. API provider argument", () => {
    it("returns apiChatAdapter when called with 'api'", () => {
      const adapter = getChatAdapter("api");
      expect(adapter).toBe(apiChatAdapter);
    });
  });

  describe("4. VITE_CHAT_PROVIDER env var", () => {
    it("returns apiChatAdapter when VITE_CHAT_PROVIDER is 'api'", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "api");
      const adapter = getChatAdapter();
      expect(adapter).toBe(apiChatAdapter);
    });

    it("returns mockChatAdapter when VITE_CHAT_PROVIDER is 'mock'", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "mock");
      const adapter = getChatAdapter();
      expect(adapter).toBe(mockChatAdapter);
    });

    it("falls back to mockChatAdapter for an unknown provider value", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "unknown-provider");
      const adapter = getChatAdapter();
      expect(adapter).toBe(mockChatAdapter);
    });
  });

  describe("5. Explicit argument takes precedence over env var", () => {
    it("uses the explicit 'mock' argument even when VITE_CHAT_PROVIDER=api", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "api");
      const adapter = getChatAdapter("mock");
      expect(adapter).toBe(mockChatAdapter);
    });

    it("uses the explicit 'api' argument even when VITE_CHAT_PROVIDER is not set", () => {
      vi.stubEnv("VITE_CHAT_PROVIDER", "");
      const adapter = getChatAdapter("api");
      expect(adapter).toBe(apiChatAdapter);
    });
  });

  describe("6. Returned adapters have the required send method", () => {
    it("mockChatAdapter returned by factory has a send method", () => {
      const adapter = getChatAdapter("mock");
      expect(typeof adapter.send).toBe("function");
    });

    it("apiChatAdapter returned by factory has a send method", () => {
      const adapter = getChatAdapter("api");
      expect(typeof adapter.send).toBe("function");
    });
  });
});
