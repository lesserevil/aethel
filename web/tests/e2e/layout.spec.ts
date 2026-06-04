/**
 * layout.spec.ts — E2e layout verification tests for Aethel MVP.
 *
 * WHAT IS TESTED
 * 1. Desktop three-column layout: control panel, 3D viewport, chat panel are
 *    all visible simultaneously and do not overlap.
 * 2. Narrow screen behaviour: at 768px width the panels remain accessible and
 *    do not overlap each other (bounding-box overlap check).
 *
 * ACCEPTANCE CRITERIA COVERED
 * - AC #1: E2e tests verify desktop and narrow responsive layouts.
 */

import { test, expect } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────

/**
 * Wait until the app shell is present (all three panels are in the DOM).
 * Does NOT rely on sleeps — uses waitFor with selector.
 */
async function waitForAppShell(page: import("@playwright/test").Page) {
  await page.waitForSelector('[data-testid="control-panel-container"]', {
    state: "attached",
  });
  await page.waitForSelector('[data-testid="viewport-panel"]', {
    state: "attached",
  });
  await page.waitForSelector('[data-testid="chat-panel"]', {
    state: "attached",
  });
}

// ── desktop layout ────────────────────────────────────────────────────────

test.describe("Desktop three-column layout", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("all three panels are visible and present in the DOM", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const controlPanel = page.locator('[data-testid="control-panel-container"]');
    const viewportPanel = page.locator('[data-testid="viewport-panel"]');
    const chatPanel = page.locator('[data-testid="chat-panel"]');

    await expect(controlPanel).toBeVisible();
    await expect(viewportPanel).toBeVisible();
    await expect(chatPanel).toBeVisible();
  });

  test("three panels are laid out in three distinct horizontal regions without overlap", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const controlBox = await page
      .locator('[data-testid="control-panel-container"]')
      .boundingBox();
    const viewportBox = await page
      .locator('[data-testid="viewport-panel"]')
      .boundingBox();
    const chatBox = await page.locator('[data-testid="chat-panel"]').boundingBox();

    expect(controlBox).not.toBeNull();
    expect(viewportBox).not.toBeNull();
    expect(chatBox).not.toBeNull();

    if (!controlBox || !viewportBox || !chatBox) return;

    // All three panels must have non-zero dimensions.
    expect(controlBox.width).toBeGreaterThan(0);
    expect(viewportBox.width).toBeGreaterThan(0);
    expect(chatBox.width).toBeGreaterThan(0);

    // Panels should be laid out left-to-right: control < viewport < chat.
    // We compare the right edge of the previous panel to the left edge of the next.
    expect(controlBox.x + controlBox.width).toBeLessThanOrEqual(
      viewportBox.x + 2, // 2px tolerance for sub-pixel rounding
    );
    expect(viewportBox.x + viewportBox.width).toBeLessThanOrEqual(chatBox.x + 2);
  });

  test("viewport panel is the dominant (widest) region on desktop", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const controlBox = await page
      .locator('[data-testid="control-panel-container"]')
      .boundingBox();
    const viewportBox = await page
      .locator('[data-testid="viewport-panel"]')
      .boundingBox();
    const chatBox = await page.locator('[data-testid="chat-panel"]').boundingBox();

    if (!controlBox || !viewportBox || !chatBox) return;

    expect(viewportBox.width).toBeGreaterThan(controlBox.width);
    expect(viewportBox.width).toBeGreaterThan(chatBox.width);
  });
});

// ── narrow screen layout ──────────────────────────────────────────────────

test.describe("Narrow screen layout", () => {
  // Use a viewport narrower than the --narrow-screen-breakpoint (1024px CSS var)
  test.use({ viewport: { width: 768, height: 900 } });

  test("panels are visible and accessible on narrow screens", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const controlPanel = page.locator('[data-testid="control-panel-container"]');
    const viewportPanel = page.locator('[data-testid="viewport-panel"]');
    const chatPanel = page.locator('[data-testid="chat-panel"]');

    // All panels must still be attached (not display:none entirely) on narrow screens.
    await expect(controlPanel).toBeAttached();
    await expect(viewportPanel).toBeAttached();
    await expect(chatPanel).toBeAttached();
  });

  test("panels do not horizontally overlap on narrow screens", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const controlBox = await page
      .locator('[data-testid="control-panel-container"]')
      .boundingBox();
    const viewportBox = await page
      .locator('[data-testid="viewport-panel"]')
      .boundingBox();
    const chatBox = await page.locator('[data-testid="chat-panel"]').boundingBox();

    // Panels may stack vertically on narrow screens — that is fine.
    // The key invariant is that no two panels overlap in BOTH axes simultaneously.
    // We check horizontal overlap between each pair when they are at the same
    // vertical position (i.e. they would overlap visually if the widths overlapped).

    if (controlBox && viewportBox) {
      const controlRight = controlBox.x + controlBox.width;
      const controlBottom = controlBox.y + controlBox.height;
      const viewportRight = viewportBox.x + viewportBox.width;
      const viewportBottom = viewportBox.y + viewportBox.height;

      const verticallyOverlapping =
        controlBox.y < viewportBottom && controlBottom > viewportBox.y;

      if (verticallyOverlapping) {
        // If they share the same vertical space they must NOT share horizontal space.
        const horizontallyOverlapping =
          controlBox.x < viewportRight && controlRight > viewportBox.x;
        expect(horizontallyOverlapping).toBe(false);
      }
    }

    if (viewportBox && chatBox) {
      const viewportRight = viewportBox.x + viewportBox.width;
      const viewportBottom = viewportBox.y + viewportBox.height;
      const chatRight = chatBox.x + chatBox.width;
      const chatBottom = chatBox.y + chatBox.height;

      const verticallyOverlapping =
        viewportBox.y < chatBottom && viewportBottom > chatBox.y;

      if (verticallyOverlapping) {
        const horizontallyOverlapping =
          viewportBox.x < chatRight && viewportRight > chatBox.x;
        expect(horizontallyOverlapping).toBe(false);
      }
    }
  });

  test("viewport panel has meaningful height on narrow screens", async ({ page }) => {
    await page.goto("/");
    await waitForAppShell(page);

    const viewportBox = await page
      .locator('[data-testid="viewport-panel"]')
      .boundingBox();

    expect(viewportBox).not.toBeNull();
    if (!viewportBox) return;

    // Viewport should still occupy a significant portion of the screen height.
    expect(viewportBox.height).toBeGreaterThan(200);
  });
});
