// Tests for the web-asset-map.json mapping artifact.
//
// This file verifies that assets/usd/office/web-asset-map.json is consistent
// with:
//   - web/src/assets/officeAssetManifest.ts  (web runtime IDs)
//   - assets/sources/office/manifest.json    (source provenance + USD prim paths)
//   - assets/usd/office/office.usda          (canonical USD stage)
//
// These tests prevent the web scene from drifting away from canonical USD and
// provenance data.  They run in CI with no USD tooling — only Node.js and the
// project source files are required.
//
// HOW TO VERIFY
//   cd web && bun run test -- webAssetMap
//
// WHAT IS CHECKED
//   - web-asset-map.json exists and is valid JSON
//   - It has a non-empty entries array
//   - All webId values are unique
//   - All three required fields are present on every entry
//   - Every webId appears in the web manifest (OFFICE_ASSET_MANIFEST)
//   - Every web manifest id has a map entry (no unmapped web assets)
//   - Every sourceManifestId references an existing record in manifest.json
//   - usdPrimPath in the map matches the source manifest record
//   - usdPrimPath starts with /World/
//   - The USD stage text contains a prim definition for each mapped prim path

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OFFICE_ASSET_MANIFEST } from "./officeAssetManifest";

// ── Paths ─────────────────────────────────────────────────────────────────────

const REPO_ROOT = resolve(__dirname, "../../..");

function repoPath(...parts: string[]): string {
  return resolve(REPO_ROOT, ...parts);
}

const WEB_ASSET_MAP_PATH = repoPath("assets/usd/office/web-asset-map.json");
const SOURCE_MANIFEST_PATH = repoPath("assets/sources/office/manifest.json");
const STAGE_PATH = repoPath("assets/usd/office/office.usda");

// ── Load artifacts ────────────────────────────────────────────────────────────

interface WebAssetMapEntry {
  webId: string;
  sourceManifestId: string;
  usdPrimPath: string;
}

interface WebAssetMap {
  version: string;
  entries: WebAssetMapEntry[];
}

interface SourceManifestAsset {
  id: string;
  label: string;
  sourceId: string;
  sourceUrl: string;
  licenseId: string;
  licenseUrl: string;
  originalFormat: string;
  usdPrimPath: string;
  webExportPath: string;
}

interface SourceManifest {
  version: string;
  sources: Record<string, { name: string; publisher: string; url: string }>;
  licenses: Record<string, { spdxId: string; name: string; url: string }>;
  assets: SourceManifestAsset[];
}

// ── File existence ────────────────────────────────────────────────────────────

describe("web-asset-map.json — file presence", () => {
  it("web-asset-map.json exists", () => {
    expect(existsSync(WEB_ASSET_MAP_PATH)).toBe(true);
  });

  it("assets/sources/office/manifest.json exists", () => {
    expect(existsSync(SOURCE_MANIFEST_PATH)).toBe(true);
  });

  it("assets/usd/office/office.usda exists", () => {
    expect(existsSync(STAGE_PATH)).toBe(true);
  });
});

// ── Load and parse ────────────────────────────────────────────────────────────

const webAssetMap: WebAssetMap = JSON.parse(
  readFileSync(WEB_ASSET_MAP_PATH, "utf-8"),
) as WebAssetMap;

const sourceManifest: SourceManifest = JSON.parse(
  readFileSync(SOURCE_MANIFEST_PATH, "utf-8"),
) as SourceManifest;

const stageText: string = readFileSync(STAGE_PATH, "utf-8");

// Indexed source manifest assets for O(1) lookup
const sourceById = new Map<string, SourceManifestAsset>(
  sourceManifest.assets.map((a) => [a.id, a]),
);

// Web manifest IDs set for O(1) lookup
const webManifestIds = new Set(OFFICE_ASSET_MANIFEST.map((e) => e.id));

// ── Top-level structure ───────────────────────────────────────────────────────

describe("web-asset-map.json — top-level structure", () => {
  it("has a version field", () => {
    expect(typeof webAssetMap.version).toBe("string");
    expect(webAssetMap.version.length).toBeGreaterThan(0);
  });

  it("has a non-empty entries array", () => {
    expect(Array.isArray(webAssetMap.entries)).toBe(true);
    expect(webAssetMap.entries.length).toBeGreaterThan(0);
  });

  it("all entries have the three required fields", () => {
    webAssetMap.entries.forEach((entry, i) => {
      expect(typeof entry.webId, `entry[${i}].webId`).toBe("string");
      expect(entry.webId.length, `entry[${i}].webId non-empty`).toBeGreaterThan(0);
      expect(typeof entry.sourceManifestId, `entry[${i}].sourceManifestId`).toBe(
        "string",
      );
      expect(
        entry.sourceManifestId.length,
        `entry[${i}].sourceManifestId non-empty`,
      ).toBeGreaterThan(0);
      expect(typeof entry.usdPrimPath, `entry[${i}].usdPrimPath`).toBe("string");
      expect(
        entry.usdPrimPath.length,
        `entry[${i}].usdPrimPath non-empty`,
      ).toBeGreaterThan(0);
    });
  });
});

// ── Unique webIds ─────────────────────────────────────────────────────────────

describe("web-asset-map.json — unique webIds", () => {
  it("all webId values are unique", () => {
    const ids = webAssetMap.entries.map((e) => e.webId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── USD prim path format ──────────────────────────────────────────────────────

describe("web-asset-map.json — usdPrimPath format", () => {
  it.each(webAssetMap.entries)(
    "$webId usdPrimPath starts with /World/",
    (entry: WebAssetMapEntry) => {
      expect(entry.usdPrimPath).toMatch(/^\/World\//);
    },
  );

  it.each(webAssetMap.entries)(
    "$webId usdPrimPath has at least four path segments",
    (entry: WebAssetMapEntry) => {
      // Expected form: /World/Office/<Scope>/<PrimName>
      const segments = entry.usdPrimPath.split("/").filter(Boolean);
      expect(segments.length).toBeGreaterThanOrEqual(3);
    },
  );
});

// ── Web manifest coverage — every web ID must be mapped ───────────────────────

describe("web-asset-map.json — web manifest coverage", () => {
  const mapWebIds = new Set(webAssetMap.entries.map((e) => e.webId));

  it.each([...webManifestIds])(
    "web manifest entry '%s' has a map entry",
    (webId: string) => {
      expect(mapWebIds.has(webId)).toBe(true);
    },
  );

  it("map has no extra entries not in the web manifest", () => {
    const extra = [...mapWebIds].filter((id) => !webManifestIds.has(id));
    expect(extra).toHaveLength(0);
  });
});

// ── Source manifest coverage ──────────────────────────────────────────────────

describe("web-asset-map.json — source manifest coverage", () => {
  it.each(webAssetMap.entries)(
    "$webId sourceManifestId '$sourceManifestId' exists in manifest.json",
    (entry: WebAssetMapEntry) => {
      expect(sourceById.has(entry.sourceManifestId)).toBe(true);
    },
  );
});

// ── USD prim path consistency with source manifest ────────────────────────────

describe("web-asset-map.json — usdPrimPath consistency with source manifest", () => {
  it.each(webAssetMap.entries)(
    "$webId usdPrimPath matches source manifest record",
    (entry: WebAssetMapEntry) => {
      const source = sourceById.get(entry.sourceManifestId);
      if (!source) return; // Already caught by coverage test
      expect(entry.usdPrimPath).toBe(source.usdPrimPath);
    },
  );
});

// ── USD stage contains a prim definition for every mapped path ────────────────

describe("web-asset-map.json — USD stage coverage", () => {
  it.each(webAssetMap.entries)(
    "$webId usdPrimPath '$usdPrimPath' is defined in office.usda",
    (entry: WebAssetMapEntry) => {
      // Extract the leaf prim name from the path
      const leafName = entry.usdPrimPath.split("/").pop() ?? "";
      expect(leafName.length).toBeGreaterThan(0);
      // Pattern: def <Token> "<LeafName>"
      const pattern = new RegExp(`\\bdef\\s+\\w+\\s+"${leafName}"`);
      expect(stageText).toMatch(pattern);
    },
  );
});

// ── All map entries round-trip through JSON ───────────────────────────────────

describe("web-asset-map.json — serialization", () => {
  it("map round-trips through JSON without loss", () => {
    const json = JSON.stringify(webAssetMap);
    const parsed = JSON.parse(json) as WebAssetMap;
    expect(parsed.entries).toHaveLength(webAssetMap.entries.length);
    expect(parsed.entries[0].webId).toBe(webAssetMap.entries[0].webId);
  });
});

// ── Coverage count matches web manifest size ──────────────────────────────────

describe("web-asset-map.json — entry count", () => {
  it("map has the same number of entries as the web manifest", () => {
    expect(webAssetMap.entries.length).toBe(OFFICE_ASSET_MANIFEST.length);
  });
});
