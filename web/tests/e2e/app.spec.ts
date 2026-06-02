import { test, expect } from "@playwright/test";

/**
 * Placeholder e2e tests for the Aethel web app shell.
 *
 * These tests verify the initial scaffold renders. More comprehensive
 * layout, state-sync, and 3D viewport checks will be added as the
 * three-column shell (TASK-3.2) and renderer (TASK-5) are implemented.
 */

test("app page has Aethel title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/aethel/i);
});

test("app page renders the Aethel heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /aethel/i })).toBeVisible();
});
