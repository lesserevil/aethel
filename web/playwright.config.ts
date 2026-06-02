import { defineConfig, devices } from "@playwright/test";

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
      use: { ...devices["Desktop Chrome"] },
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
