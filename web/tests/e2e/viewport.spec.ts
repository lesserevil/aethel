/**
 * viewport.spec.ts — E2e tests verifying that the 3D viewport is nonblank.
 *
 * WHAT IS TESTED
 * 1. The R3F canvas is present inside the viewport panel.
 * 2. The viewport emits a renderer-ready signal (`data-viewport-ready="true"`).
 * 3. After the ready signal, the canvas contains non-trivial pixel data
 *    (i.e. it is NOT a uniformly black or uniformly transparent image).
 *
 * CANVAS PIXEL SAMPLING STRATEGY
 * We read pixel data via page.evaluate + getImageData on a snapshot of the
 * canvas element. We assert that at least one rendered pixel deviates from the
 * background black or transparent value, proving the scene has actually drawn
 * something. This will FAIL if the renderer is blank.
 *
 * ACCEPTANCE CRITERIA COVERED
 * - AC #2: E2e visual check fails on a blank 3D viewport.
 */

import { test, expect } from "@playwright/test";

// ── helpers ───────────────────────────────────────────────────────────────

const VIEWPORT_READY_TIMEOUT = 20_000; // R3F scene init budget

/**
 * Wait until `data-viewport-ready="true"` is set on the viewport wrapper.
 * Uses an explicit attribute selector rather than sleeping.
 */
async function waitForViewportReady(page: import("@playwright/test").Page) {
  await page.waitForSelector(
    '[data-testid="aethel-viewport"][data-viewport-ready="true"]',
    {
      state: "attached",
      timeout: VIEWPORT_READY_TIMEOUT,
    },
  );
}

// ── tests ─────────────────────────────────────────────────────────────────

test.describe("3D viewport nonblank checks", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("viewport panel contains a canvas element", async ({ page }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    const canvas = page.locator('[data-testid="viewport-panel"] canvas');
    await expect(canvas).toBeAttached();
    // Canvas must have positive dimensions — not a 0×0 placeholder.
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });

  test("viewport signals renderer-ready after mount", async ({ page }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    const viewport = page.locator('[data-testid="aethel-viewport"]');
    await expect(viewport).toHaveAttribute("data-viewport-ready", "true");
  });

  test("canvas contains non-trivial pixel data (viewport is not blank)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    // Give the R3F render loop a couple of animation frames to paint the scene.
    await page.waitForTimeout(500);

    // Use Playwright's screenshot API to capture the viewport panel area.
    // This avoids the WebGL preserveDrawingBuffer=false limitation where
    // getImageData returns zeros after each frame has been presented.
    const viewportPanel = page.locator('[data-testid="viewport-panel"]');
    const screenshotBytes = await viewportPanel.screenshot();

    // Parse the PNG bytes to get pixel data.
    // The PNG header is 8 bytes, IHDR chunk is at offset 8.
    // We use a simple approach: check that the screenshot is not all-black by
    // sampling the raw PNG data for non-zero bytes beyond the header.
    //
    // A blank (all-black) canvas would have a PNG with very high compression
    // (uniform black). We verify there are content pixels by using
    // page.evaluate with an Image element to decode the PNG.
    const isNonBlank = await page.evaluate(async (pngBase64: string) => {
      const img = new Image();
      const blob = await fetch(`data:image/png;base64,${pngBase64}`).then((r) =>
        r.blob(),
      );
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const offscreen = document.createElement("canvas");
      offscreen.width = Math.min(img.naturalWidth, 128);
      offscreen.height = Math.min(img.naturalHeight, 128);
      const ctx = offscreen.getContext("2d");
      if (!ctx) return { nonBlank: false, reason: "no 2d context" };

      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
      const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imageData.data;

      let nonBackgroundCount = 0;
      const sampleStep = 4;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;
        // Near-black threshold: WebGL clear color is typically near-black.
        // The scene has lights, colored walls, agent geometry — these produce
        // pixels with at least one channel > 10.
        if (r <= 10 && g <= 10 && b <= 10) continue;

        nonBackgroundCount++;
      }

      const totalSampled = Math.floor(data.length / (4 * sampleStep));
      return {
        nonBlank: nonBackgroundCount > 0,
        reason: `${nonBackgroundCount} non-background pixels out of ${totalSampled} sampled`,
        nonBackgroundCount,
        totalSampled,
      };
    }, screenshotBytes.toString("base64"));

    // Provide meaningful failure output.
    expect(isNonBlank.nonBlank, `3D viewport appears blank: ${isNonBlank.reason}`).toBe(
      true,
    );
  });

  test("agent name label is present in the viewport overlay", async ({ page }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    // The AgentAvatar renders an HTML overlay label via @react-three/drei Html.
    // We verify the label exists and contains non-empty text.
    const label = page.locator('[data-testid="agent-name-label"]');
    await expect(label).toBeAttached({ timeout: VIEWPORT_READY_TIMEOUT });

    const labelText = await label.textContent();
    expect(labelText).toBeTruthy();
    expect((labelText ?? "").trim().length).toBeGreaterThan(0);
  });
});
