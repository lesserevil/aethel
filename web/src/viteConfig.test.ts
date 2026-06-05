import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const viteConfigText = readFileSync(resolve(__dirname, "../vite.config.ts"), "utf-8");

describe("vite dev server config", () => {
  it("proxies /api requests to the local backend", () => {
    expect(viteConfigText).toContain('"/api"');
    expect(viteConfigText).toContain('target: "http://127.0.0.1:8000"');
    expect(viteConfigText).toContain("changeOrigin: true");
  });
});
