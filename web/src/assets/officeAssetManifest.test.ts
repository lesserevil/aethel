// Tests for the office asset manifest.
// These tests fail if any manifest asset is missing required provenance,
// license, transform, dimensions, or collider metadata.

import {
  OFFICE_ASSET_MANIFEST,
  getAssetById,
  getAssetsByCategory,
  type OfficeAssetEntry,
  type AssetCategory,
} from "./officeAssetManifest";

const VALID_COLLIDER_HINTS = ["box", "cylinder", "convexHull", "none"] as const;
const VALID_CATEGORIES: AssetCategory[] = ["furniture", "device", "container", "clutter"];

// ── Manifest completeness ─────────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST completeness", () => {
  test("exports a non-empty array", () => {
    expect(Array.isArray(OFFICE_ASSET_MANIFEST)).toBe(true);
    expect(OFFICE_ASSET_MANIFEST.length).toBeGreaterThan(0);
  });

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a non-empty local URL under /assets/office/",
    (entry: OfficeAssetEntry) => {
      expect(typeof entry.url).toBe("string");
      expect(entry.url.length).toBeGreaterThan(0);
      expect(entry.url).toMatch(/^\/assets\/office\/.+\.glb$/);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a non-empty source URL",
    (entry: OfficeAssetEntry) => {
      expect(typeof entry.sourceUrl).toBe("string");
      expect(entry.sourceUrl.length).toBeGreaterThan(0);
      expect(entry.sourceUrl).toMatch(/^https?:\/\//);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)("$id has a source name", (entry: OfficeAssetEntry) => {
    expect(typeof entry.sourceName).toBe("string");
    expect(entry.sourceName.length).toBeGreaterThan(0);
  });

  test.each(OFFICE_ASSET_MANIFEST)("$id has a license ID", (entry: OfficeAssetEntry) => {
    expect(typeof entry.licenseId).toBe("string");
    expect(entry.licenseId.length).toBeGreaterThan(0);
  });

  test.each(OFFICE_ASSET_MANIFEST)("$id has a license URL", (entry: OfficeAssetEntry) => {
    expect(typeof entry.licenseUrl).toBe("string");
    expect(entry.licenseUrl.length).toBeGreaterThan(0);
    expect(entry.licenseUrl).toMatch(/^https?:\/\//);
  });

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a valid collider hint",
    (entry: OfficeAssetEntry) => {
      expect(VALID_COLLIDER_HINTS).toContain(entry.colliderHint);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a valid category",
    (entry: OfficeAssetEntry) => {
      expect(VALID_CATEGORIES).toContain(entry.category);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)("$id has a label", (entry: OfficeAssetEntry) => {
    expect(typeof entry.label).toBe("string");
    expect(entry.label.length).toBeGreaterThan(0);
  });
});

// ── Transform completeness ────────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST transform fields", () => {
  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a defaultTransform with position",
    (entry: OfficeAssetEntry) => {
      expect(entry.defaultTransform).toBeDefined();
      expect(typeof entry.defaultTransform.position.x).toBe("number");
      expect(typeof entry.defaultTransform.position.y).toBe("number");
      expect(typeof entry.defaultTransform.position.z).toBe("number");
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a defaultTransform with rotation",
    (entry: OfficeAssetEntry) => {
      expect(entry.defaultTransform).toBeDefined();
      expect(typeof entry.defaultTransform.rotation.x).toBe("number");
      expect(typeof entry.defaultTransform.rotation.y).toBe("number");
      expect(typeof entry.defaultTransform.rotation.z).toBe("number");
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has a defaultTransform with scale",
    (entry: OfficeAssetEntry) => {
      expect(entry.defaultTransform).toBeDefined();
      expect(typeof entry.defaultTransform.scale.x).toBe("number");
      expect(typeof entry.defaultTransform.scale.y).toBe("number");
      expect(typeof entry.defaultTransform.scale.z).toBe("number");
    },
  );
});

// ── Dimensions completeness ───────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST dimension fields", () => {
  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has positive width in meters",
    (entry: OfficeAssetEntry) => {
      expect(entry.dimensions).toBeDefined();
      expect(entry.dimensions.width).toBeGreaterThan(0);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has positive height in meters",
    (entry: OfficeAssetEntry) => {
      expect(entry.dimensions).toBeDefined();
      expect(entry.dimensions.height).toBeGreaterThan(0);
    },
  );

  test.each(OFFICE_ASSET_MANIFEST)(
    "$id has positive depth in meters",
    (entry: OfficeAssetEntry) => {
      expect(entry.dimensions).toBeDefined();
      expect(entry.dimensions.depth).toBeGreaterThan(0);
    },
  );
});

// ── Unique IDs ────────────────────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST stable IDs", () => {
  test("all IDs are unique", () => {
    const ids = OFFICE_ASSET_MANIFEST.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("all IDs are non-empty strings", () => {
    OFFICE_ASSET_MANIFEST.forEach((entry) => {
      expect(typeof entry.id).toBe("string");
      expect(entry.id.length).toBeGreaterThan(0);
    });
  });
});

// ── MVP asset set coverage ────────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST MVP coverage", () => {
  const mvpRequiredIds = [
    "office-desk",
    "office-chair",
    "office-laptop",
    "office-keyboard",
    "office-monitor",
    "office-trash-can",
    "office-desk-lamp",
  ];

  test.each(mvpRequiredIds)("manifest includes required MVP asset: %s", (id) => {
    const entry = OFFICE_ASSET_MANIFEST.find((e) => e.id === id);
    expect(entry).toBeDefined();
  });

  test("manifest includes at least three clutter items", () => {
    const clutter = OFFICE_ASSET_MANIFEST.filter((e) => e.category === "clutter");
    expect(clutter.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Serialization ─────────────────────────────────────────────────────────────

describe("OFFICE_ASSET_MANIFEST serialization", () => {
  test("entire manifest round-trips through JSON without loss", () => {
    const json = JSON.stringify(OFFICE_ASSET_MANIFEST);
    const parsed = JSON.parse(json) as typeof OFFICE_ASSET_MANIFEST;
    expect(parsed).toHaveLength(OFFICE_ASSET_MANIFEST.length);
    expect(parsed[0].id).toBe(OFFICE_ASSET_MANIFEST[0].id);
  });

  test("manifest contains no non-serializable values", () => {
    const json = JSON.stringify(OFFICE_ASSET_MANIFEST);
    expect(json).not.toContain('"undefined"');
    // Attempt parse should not throw
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ── getAssetById helper ───────────────────────────────────────────────────────

describe("getAssetById", () => {
  test("returns the correct entry for a known ID", () => {
    const entry = getAssetById("office-desk");
    expect(entry).toBeDefined();
    expect(entry?.id).toBe("office-desk");
    expect(entry?.label).toBe("Office Desk");
  });

  test("returns undefined for an unknown ID", () => {
    expect(getAssetById("nonexistent-asset")).toBeUndefined();
  });

  test("returns undefined for an empty string", () => {
    expect(getAssetById("")).toBeUndefined();
  });

  test("does not mutate the manifest when called", () => {
    const countBefore = OFFICE_ASSET_MANIFEST.length;
    getAssetById("office-chair");
    expect(OFFICE_ASSET_MANIFEST.length).toBe(countBefore);
  });
});

// ── getAssetsByCategory helper ────────────────────────────────────────────────

describe("getAssetsByCategory", () => {
  test("returns all furniture assets", () => {
    const furniture = getAssetsByCategory("furniture");
    expect(furniture.length).toBeGreaterThan(0);
    furniture.forEach((e) => expect(e.category).toBe("furniture"));
  });

  test("returns all device assets", () => {
    const devices = getAssetsByCategory("device");
    expect(devices.length).toBeGreaterThan(0);
    devices.forEach((e) => expect(e.category).toBe("device"));
  });

  test("returns all container assets", () => {
    const containers = getAssetsByCategory("container");
    expect(containers.length).toBeGreaterThan(0);
    containers.forEach((e) => expect(e.category).toBe("container"));
  });

  test("returns all clutter assets", () => {
    const clutter = getAssetsByCategory("clutter");
    expect(clutter.length).toBeGreaterThan(0);
    clutter.forEach((e) => expect(e.category).toBe("clutter"));
  });

  test("all categories together cover the full manifest", () => {
    const all = [
      ...getAssetsByCategory("furniture"),
      ...getAssetsByCategory("device"),
      ...getAssetsByCategory("container"),
      ...getAssetsByCategory("clutter"),
    ];
    expect(all.length).toBe(OFFICE_ASSET_MANIFEST.length);
  });
});
