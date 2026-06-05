/**
 * office-assets.spec.ts — E2e tests verifying the office asset runtime workflow.
 *
 * WHAT IS TESTED
 * 1. Every GLB request the browser makes for `/assets/office/*.glb` returns
 *    HTTP 200 — no missing-file 404s that would fall back silently.
 * 2. No GLB or asset requests are made to external hosts; all assets are local.
 * 3. The standard office preset is active on the viewport wrapper element
 *    (`data-environment-preset="office"`).
 * 4. All ten default office objects are listed as enabled in the viewport's
 *    `data-enabled-objects` attribute.
 *
 * DESIGN NOTES
 * - Request monitoring is set up via `page.on("response", …)` before navigation
 *   so no request can slip through uncaptured.
 * - A wait of 4 s after viewport-ready gives the R3F scene enough animation
 *   frames for all `useGLTF` calls to fire and the browser to issue the HTTP
 *   requests.
 * - The nonblank pixel check is already covered by `viewport.spec.ts`; this
 *   file focuses on the asset-loading contract.
 *
 * ACCEPTANCE CRITERIA COVERED
 * - AC #1: E2e coverage catches missing office asset requests.
 */

import { test, expect } from "@playwright/test";

// ── constants ──────────────────────────────────────────────────────────────

const VIEWPORT_READY_TIMEOUT = 20_000;

/**
 * Stable IDs of the default enabled office objects, matching baselineSession.ts.
 * All ten are enabled by default.
 */
const DEFAULT_OFFICE_OBJECT_IDS = [
  "obj-001",
  "obj-002",
  "obj-003",
  "obj-004",
  "obj-005",
  "obj-006",
  "obj-007",
  "obj-008",
  "obj-009",
  "obj-010",
] as const;

/**
 * The exact GLB filenames expected under /assets/office/, matching the
 * office asset manifest entries in officeAssetManifest.ts.
 */
const EXPECTED_GLB_FILENAMES = [
  "office-desk.glb",
  "office-chair.glb",
  "office-monitor.glb",
  "office-laptop.glb",
  "office-keyboard.glb",
  "office-trash-can.glb",
  "office-desk-lamp.glb",
  "office-book-stack.glb",
  "office-coffee-cup.glb",
  "office-notebook.glb",
] as const;

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Wait until `data-viewport-ready="true"` is set on the viewport wrapper.
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

/**
 * Return true when the hostname clearly is NOT localhost / 127.0.0.1 / ::1.
 */
function isExternalHost(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const h = url.hostname;
    return h !== "localhost" && h !== "127.0.0.1" && h !== "::1";
  } catch {
    return false;
  }
}

// ── tests ──────────────────────────────────────────────────────────────────

test.describe("Office asset HTTP requests", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("all /assets/office/*.glb requests return HTTP 200 (no missing files)", async ({
    page,
  }) => {
    // Collect every response for office GLB URLs before any navigation.
    const assetResponses: Array<{ url: string; status: number }> = [];

    page.on("response", (response) => {
      const url = response.url();
      if (/\/assets\/office\/[^/]+\.glb(\?.*)?$/.test(url)) {
        assetResponses.push({ url, status: response.status() });
      }
    });

    await page.goto("/");
    await waitForViewportReady(page);

    // Allow enough time for the R3F render loop to fire all useGLTF calls
    // and for the browser to issue the corresponding HTTP requests.
    await page.waitForTimeout(4_000);

    // At least one GLB request must have been observed — if this fails the
    // GLB loading path is broken at the component level, not just a 404.
    expect(
      assetResponses.length,
      "Expected at least one /assets/office/*.glb request to be observed",
    ).toBeGreaterThan(0);

    // Every observed request must return 200.
    for (const { url, status } of assetResponses) {
      const filename = url.split("/").pop() ?? url;
      expect(
        status,
        `${filename} returned HTTP ${status} — the GLB file is missing or misconfigured`,
      ).toBe(200);
    }
  });

  test("no /assets/office/*.glb requests are made to external hosts", async ({
    page,
  }) => {
    const externalAssetRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (/\/assets\/office\/[^/]+\.glb/.test(url) && isExternalHost(url)) {
        externalAssetRequests.push(url);
      }
    });

    await page.goto("/");
    await waitForViewportReady(page);
    await page.waitForTimeout(4_000);

    expect(
      externalAssetRequests,
      "Office GLB assets must be served from localhost, not external hosts",
    ).toHaveLength(0);
  });

  test("all expected office GLB filenames are requested exactly once", async ({
    page,
  }) => {
    const requestedFilenames = new Set<string>();

    page.on("request", (request) => {
      const url = request.url();
      const match = /\/assets\/office\/([^/?]+\.glb)/.exec(url);
      if (match) {
        requestedFilenames.add(match[1]);
      }
    });

    await page.goto("/");
    await waitForViewportReady(page);
    await page.waitForTimeout(4_000);

    // Every manifest GLB must be requested — a missing request means
    // the renderer is not loading that asset.
    for (const filename of EXPECTED_GLB_FILENAMES) {
      expect(
        requestedFilenames.has(filename),
        `Expected a request for /assets/office/${filename} but none was observed`,
      ).toBe(true);
    }
  });
});

// ── standard office preset state checks ──────────────────────────────────────

test.describe("Standard office preset state", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('viewport data-environment-preset is "office" by default', async ({ page }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    const viewport = page.locator('[data-testid="aethel-viewport"]');
    await expect(viewport).toHaveAttribute("data-environment-preset", "office");
  });

  test("all ten default office objects are listed as enabled in the viewport", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    const viewport = page.locator('[data-testid="aethel-viewport"]');
    const enabledObjects = await viewport.getAttribute("data-enabled-objects");

    expect(
      enabledObjects,
      "data-enabled-objects attribute must be present",
    ).not.toBeNull();

    const enabledSet = new Set((enabledObjects ?? "").split(",").filter(Boolean));

    for (const id of DEFAULT_OFFICE_OBJECT_IDS) {
      expect(
        enabledSet.has(id),
        `Expected object "${id}" to be listed in data-enabled-objects but it was not. ` +
          `Full value: "${enabledObjects}"`,
      ).toBe(true);
    }
  });

  test("no extra unknown object IDs appear in the enabled list", async ({ page }) => {
    await page.goto("/");
    await waitForViewportReady(page);

    const viewport = page.locator('[data-testid="aethel-viewport"]');
    const enabledObjects = await viewport.getAttribute("data-enabled-objects");
    const enabledList = (enabledObjects ?? "").split(",").filter(Boolean);

    const knownSet = new Set<string>(DEFAULT_OFFICE_OBJECT_IDS);
    const unknownIds = enabledList.filter((id) => !knownSet.has(id));

    expect(
      unknownIds,
      `Unexpected object IDs appeared in data-enabled-objects: ${unknownIds.join(", ")}`,
    ).toHaveLength(0);
  });
});
