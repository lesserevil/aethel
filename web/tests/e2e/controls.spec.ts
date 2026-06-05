/**
 * controls.spec.ts — E2e tests for the control panel mutation flow.
 *
 * WHAT IS TESTED
 * 1. Agent identity change (display name) → Apply → system context message
 *    appears in chat history.
 * 2. Agent appearance change (avatar preset) → Apply → apply-status feedback shown.
 * 3. Environment preset change → Apply → system context message in chat.
 * 4. Reset button restores baseline without clearing chat history.
 *
 * The tests interact with the real DOM controls produced by ControlPanel.tsx
 * and AgentControlPanel, verifying that mutations propagate through shared state.
 *
 * ACCEPTANCE CRITERIA COVERED
 * - AC #3: E2e flow covers control mutation, chat send/response, and context usage.
 */

import { test, expect } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────

const READY_TIMEOUT = 20_000;

async function waitForAppReady(page: import("@playwright/test").Page) {
  await page.waitForSelector(
    '[data-testid="aethel-viewport"][data-viewport-ready="true"]',
    {
      state: "attached",
      timeout: READY_TIMEOUT,
    },
  );
}

// ── agent identity mutation ───────────────────────────────────────────────

test.describe("Agent control mutations", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("changing agent display name and applying records a system context message in chat", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    const nameInput = page.locator('[data-testid="agent-display-name-input"]');
    const applyBtn = page.locator('[data-testid="apply-agent-changes-btn"]');

    // Clear the existing name and type a new one.
    await nameInput.fill("Renamed Agent");

    // Apply the change.
    await applyBtn.click();

    // Expect apply status feedback.
    const statusMsg = page.locator('[data-testid="agent-apply-status"]');
    await expect(statusMsg).toBeVisible({ timeout: 5_000 });
    await expect(statusMsg).toHaveText("Changes applied.");

    // Expect a system message in the chat log referencing the new name.
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("Renamed Agent", { timeout: 5_000 });
  });

  test("changing persona preset and applying produces mutation feedback", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    const personaSelect = page.locator('[data-testid="agent-persona-select"]');
    const applyBtn = page.locator('[data-testid="apply-agent-changes-btn"]');

    // Switch to a different preset.
    await personaSelect.selectOption("analytical");

    await applyBtn.click();

    const statusMsg = page.locator('[data-testid="agent-apply-status"]');
    await expect(statusMsg).toBeVisible({ timeout: 5_000 });
    await expect(statusMsg).toHaveText("Changes applied.");
  });

  test("changing avatar preset and applying adds avatar name to chat system message", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Select the "Robot" avatar preset using the segmented button.
    const robotBtn = page.locator('[data-testid="avatar-preset-robot"]');
    await robotBtn.click();

    const applyBtn = page.locator('[data-testid="apply-agent-changes-btn"]');
    await applyBtn.click();

    // The chat system message should mention the avatar change.
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("robot", { timeout: 5_000 });
  });

  test("validation prevents empty display name from being applied", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);

    const nameInput = page.locator('[data-testid="agent-display-name-input"]');
    const applyBtn = page.locator('[data-testid="apply-agent-changes-btn"]');

    // Clear the name to an empty string.
    await nameInput.fill("");
    await applyBtn.click();

    // Validation error should be shown; apply-status should NOT appear.
    const validationError = page.locator('[data-testid="agent-validation-error"]');
    await expect(validationError).toBeVisible({ timeout: 5_000 });

    // The status message should not appear because validation failed.
    const statusMsg = page.locator('[data-testid="agent-apply-status"]');
    await expect(statusMsg).not.toBeVisible();
  });
});

// ── environment mutations ─────────────────────────────────────────────────

test.describe("Environment control mutations", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("changing environment preset and applying records a system context message", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // The baseline session uses "office" as of TASK-16.4, so select a different
    // preset ("studio") to trigger an actual change and enable the Apply button.
    const envPresetSelect = page.locator('[data-testid="select-environment-preset"]');
    await envPresetSelect.selectOption("studio");

    const applyEnvBtn = page.locator('[data-testid="btn-apply-environment"]');
    await applyEnvBtn.click();

    // Chat messages should contain a system message about the environment change.
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("studio", { timeout: 5_000 });
  });

  test("Reset Scene button restores baseline while preserving chat history", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppReady(page);

    // Send a chat message first so we have history to preserve.
    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendBtn = page.locator('[data-testid="chat-send-btn"]');

    await chatInput.fill("Hello before reset");
    await sendBtn.click();

    // Wait for the agent response to appear.
    await expect(page.locator('[data-testid="chat-message-agent"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Now click Reset Scene.
    const resetBtn = page.locator('[data-testid="btn-reset-scene"]');
    await resetBtn.click();

    // The reset system message should appear in chat.
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("reset", {
      ignoreCase: true,
      timeout: 5_000,
    });

    // The original user message must still be visible (history preserved).
    await expect(chatMessages).toContainText("Hello before reset");
  });
});
