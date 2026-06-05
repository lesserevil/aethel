// Tests for the USD pipeline source manifest at assets/sources/office/manifest.json.
//
// These tests prevent drift between the human-readable provenance document
// (docs/office-asset-sources.md) and the machine-readable catalog. The
// canonical asset ID set is hardcoded from docs/office-asset-sources.md.
// If that document changes, update EXPECTED_ASSET_IDS below to match.
//
// Schema:  assets/sources/office/manifest.schema.json

import { describe, it, expect } from "vitest";
import manifest from "../../../assets/sources/office/manifest.json";

// ── Canonical asset IDs from docs/office-asset-sources.md ─────────────────────
//
// These are the IDs in the "Asset ID" column of the Selected Assets table.
// Keep this list in sync with that document.
const EXPECTED_ASSET_IDS = [
  "desk",
  "deskChair",
  "laptop",
  "keyboard",
  "monitorWide",
  "trashCan",
  "lampDesk",
  "mug",
  "book",
  "notebook",
] as const;

type ExpectedId = (typeof EXPECTED_ASSET_IDS)[number];

// ── Top-level structure ───────────────────────────────────────────────────────

describe("office source manifest — top-level structure", () => {
  it("has a version field", () => {
    expect(typeof manifest.version).toBe("string");
    expect(manifest.version.length).toBeGreaterThan(0);
  });

  it("has a sources dictionary", () => {
    expect(typeof manifest.sources).toBe("object");
    expect(manifest.sources).not.toBeNull();
  });

  it("has a licenses dictionary", () => {
    expect(typeof manifest.licenses).toBe("object");
    expect(manifest.licenses).not.toBeNull();
  });

  it("has an assets array", () => {
    expect(Array.isArray(manifest.assets)).toBe(true);
    expect(manifest.assets.length).toBeGreaterThan(0);
  });
});

// ── Asset IDs — drift detection against docs/office-asset-sources.md ─────────

describe("office source manifest — asset ID coverage", () => {
  const manifestIds = manifest.assets.map((a) => a.id);

  it.each(EXPECTED_ASSET_IDS)(
    "manifest contains expected asset ID from docs: %s",
    (expectedId: ExpectedId) => {
      expect(manifestIds).toContain(expectedId);
    },
  );

  it("manifest has no more assets than expected", () => {
    expect(manifest.assets.length).toBe(EXPECTED_ASSET_IDS.length);
  });

  it("all asset IDs are unique", () => {
    const ids = manifest.assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── Per-asset required fields ─────────────────────────────────────────────────

describe("office source manifest — required asset fields", () => {
  it.each(manifest.assets)(
    "$id has a non-empty label",
    (asset: (typeof manifest.assets)[number]) => {
      expect(typeof asset.label).toBe("string");
      expect(asset.label.length).toBeGreaterThan(0);
    },
  );

  it.each(manifest.assets)(
    "$id has a sourceId that references a known source",
    (asset: (typeof manifest.assets)[number]) => {
      expect(typeof asset.sourceId).toBe("string");
      expect(asset.sourceId.length).toBeGreaterThan(0);
      expect(Object.keys(manifest.sources)).toContain(asset.sourceId);
    },
  );

  it.each(manifest.assets)(
    "$id has a sourceUrl starting with https://",
    (asset: (typeof manifest.assets)[number]) => {
      expect(asset.sourceUrl).toMatch(/^https?:\/\//);
    },
  );

  it.each(manifest.assets)(
    "$id has a licenseId that references a known license",
    (asset: (typeof manifest.assets)[number]) => {
      expect(typeof asset.licenseId).toBe("string");
      expect(asset.licenseId.length).toBeGreaterThan(0);
      expect(Object.keys(manifest.licenses)).toContain(asset.licenseId);
    },
  );

  it.each(manifest.assets)(
    "$id has a licenseUrl starting with https://",
    (asset: (typeof manifest.assets)[number]) => {
      expect(asset.licenseUrl).toMatch(/^https?:\/\//);
    },
  );

  it.each(manifest.assets)(
    "$id has a non-empty originalFormat",
    (asset: (typeof manifest.assets)[number]) => {
      expect(typeof asset.originalFormat).toBe("string");
      expect(asset.originalFormat.length).toBeGreaterThan(0);
    },
  );

  it.each(manifest.assets)(
    "$id has a usdPrimPath under /World/Office/",
    (asset: (typeof manifest.assets)[number]) => {
      expect(asset.usdPrimPath).toMatch(/^\/World\/Office\//);
    },
  );

  it.each(manifest.assets)(
    "$id has a webExportPath under assets/exports/web/office/",
    (asset: (typeof manifest.assets)[number]) => {
      expect(asset.webExportPath).toMatch(/^assets\/exports\/web\/office\//);
    },
  );

  it.each(manifest.assets)(
    "$id webExportPath ends with .glb",
    (asset: (typeof manifest.assets)[number]) => {
      expect(asset.webExportPath).toMatch(/\.glb$/);
    },
  );
});

// ── All assets are CC0 ────────────────────────────────────────────────────────

describe("office source manifest — license compliance", () => {
  it("all assets use the cc0-1.0 license", () => {
    for (const asset of manifest.assets) {
      expect(asset.licenseId).toBe("cc0-1.0");
    }
  });

  it("cc0-1.0 license entry has spdxId, name, and url", () => {
    const cc0 = (
      manifest.licenses as Record<string, { spdxId: string; name: string; url: string }>
    )["cc0-1.0"];
    expect(cc0).toBeDefined();
    expect(cc0.spdxId).toBe("CC0-1.0");
    expect(cc0.name).toMatch(/CC0/i);
    expect(cc0.url).toMatch(/creativecommons\.org/);
  });
});

// ── Sources integrity ─────────────────────────────────────────────────────────

describe("office source manifest — sources integrity", () => {
  it("kenney-furniture-kit source has name, publisher, and url", () => {
    const src = (
      manifest.sources as Record<string, { name: string; publisher: string; url: string }>
    )["kenney-furniture-kit"];
    expect(src).toBeDefined();
    expect(src.name).toBeTruthy();
    expect(src.publisher).toBeTruthy();
    expect(src.url).toMatch(/^https?:\/\//);
  });

  it("eclair-home-desk-props source has name, publisher, and url", () => {
    const src = (
      manifest.sources as Record<string, { name: string; publisher: string; url: string }>
    )["eclair-home-desk-props"];
    expect(src).toBeDefined();
    expect(src.name).toBeTruthy();
    expect(src.publisher).toBeTruthy();
    expect(src.url).toMatch(/^https?:\/\//);
  });
});
