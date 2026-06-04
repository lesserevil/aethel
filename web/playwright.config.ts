import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";
import { existsSync } from "fs";

/**
 * Resolve the Chromium/Chrome executable for this environment.
 *
 * Prefers PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH env var, then falls back to
 * well-known system Chrome locations. Returns undefined to let Playwright use
 * its own bundled binary if none of the system paths exist.
 */
function resolveChromiumExecutable(): string | undefined {
  if (process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"]) {
    return process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"];
  }
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        execSync(`test -x "${p}"`, { stdio: "ignore" });
        return p;
      } catch {
        /* not executable */
      }
    }
  }
  return undefined;
}

/**
 * Playwright configuration for Aethel browser/e2e tests.
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Maximum time one test can run. */
  timeout: 30_000,
  expect: {
    /* Maximum time expect() should wait for the condition. */
    timeout: 5_000,
  },
  /* Run tests in files in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source. */
  forbidOnly: !!process.env["CI"],
  /* Retry on CI only. */
  retries: process.env["CI"] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env["CI"] ? 1 : undefined,
  reporter: "html",
  use: {
    /* Base URL for all requests. */
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use the system-installed Chrome when Playwright's bundled Chromium is
        // unavailable (e.g., unsupported OS / CI without --with-deps).
        // `channel: "chrome"` tells Playwright to find the system Google Chrome
        // installation instead of the bundled headless shell. Falls back to the
        // explicit executablePath for non-standard installations.
        channel: "chrome",
      },
    },
  ],
  /* Run the Vite dev server before starting the tests. */
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000,
  },
});
