// Tests for the asset pipeline Make targets and backing scripts.
//
// These tests assert that the non-interactive asset pipeline scaffolding
// exists and is correctly structured.  They do NOT invoke Blender or
// usd-core — tool availability is tested at runtime by the shell scripts.
//
// Related Make targets: assets-build, assets-validate, assets-export-web
// Backing scripts:      scripts/assets/assets-{build,validate,export-web}.sh
// Documentation:        docs/asset-pipeline.md

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

// Path from web/src/assets/ up to the repo root.
const REPO_ROOT = resolve(__dirname, "../../..");

function repoPath(...parts: string[]): string {
  return resolve(REPO_ROOT, ...parts);
}

interface GlbPrimitive {
  attributes?: {
    POSITION?: number;
  };
  indices?: number;
}

interface GlbAccessor {
  bufferView?: number;
  componentType?: number;
  count?: number;
  type?: string;
}

interface GlbJson {
  asset?: {
    version?: string;
  };
  nodes?: unknown[];
  meshes?: {
    primitives?: GlbPrimitive[];
  }[];
  buffers?: {
    byteLength?: number;
  }[];
  bufferViews?: unknown[];
  accessors?: GlbAccessor[];
}

function parseGlbFile(fullPath: string): { json: GlbJson; binChunkLength: number } {
  const buffer = readFileSync(fullPath);
  expect(buffer.toString("utf-8", 0, 4)).toBe("glTF");
  expect(buffer.readUInt32LE(4)).toBe(2);
  expect(buffer.readUInt32LE(8)).toBe(buffer.length);

  let offset = 12;
  let json: GlbJson | undefined;
  let binChunkLength = 0;

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    expect(chunkEnd).toBeLessThanOrEqual(buffer.length);

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(buffer.subarray(chunkStart, chunkEnd).toString("utf-8").trim());
    } else if (chunkType === 0x004e4942) {
      binChunkLength = chunkLength;
    }

    offset = chunkEnd;
  }

  expect(json).toBeDefined();
  return { json: json!, binChunkLength };
}

// ── Script existence and executability ───────────────────────────────────────

const SCRIPTS = [
  "scripts/assets/common.sh",
  "scripts/assets/assets-build.sh",
  "scripts/assets/assets-validate.sh",
  "scripts/assets/assets-export-web.sh",
] as const;

describe("asset pipeline — script files", () => {
  it.each(SCRIPTS)("script exists: %s", (scriptPath) => {
    expect(existsSync(repoPath(scriptPath))).toBe(true);
  });

  it.each(["assets-build.sh", "assets-validate.sh", "assets-export-web.sh"] as const)(
    "script is executable: scripts/assets/%s",
    (name) => {
      const fullPath = repoPath("scripts/assets", name);
      const mode = statSync(fullPath).mode;
      // Check owner-execute bit (0o100).
      expect(mode & 0o100).toBeTruthy();
    },
  );

  it.each(["assets-build.sh", "assets-validate.sh", "assets-export-web.sh"] as const)(
    "script starts with a bash shebang: scripts/assets/%s",
    (name) => {
      const content = readFileSync(repoPath("scripts/assets", name), "utf-8");
      expect(content.startsWith("#!/usr/bin/env bash")).toBe(true);
    },
  );

  it.each(["assets-build.sh", "assets-validate.sh", "assets-export-web.sh"] as const)(
    "script uses set -euo pipefail: scripts/assets/%s",
    (name) => {
      const content = readFileSync(repoPath("scripts/assets", name), "utf-8");
      expect(content).toContain("set -euo pipefail");
    },
  );

  it.each(["assets-build.sh", "assets-validate.sh", "assets-export-web.sh"] as const)(
    "script sources common.sh: scripts/assets/%s",
    (name) => {
      const content = readFileSync(repoPath("scripts/assets", name), "utf-8");
      expect(content).toContain("common.sh");
    },
  );
});

// ── Makefile targets ─────────────────────────────────────────────────────────

describe("asset pipeline — Makefile targets", () => {
  const makefile = readFileSync(repoPath("Makefile"), "utf-8");

  it("Makefile has assets-build target", () => {
    expect(makefile).toMatch(/^assets-build:/m);
  });

  it("Makefile has assets-validate target", () => {
    expect(makefile).toMatch(/^assets-validate:/m);
  });

  it("Makefile has assets-export-web target", () => {
    expect(makefile).toMatch(/^assets-export-web:/m);
  });

  it("Makefile has assets-populate-runtime target", () => {
    expect(makefile).toMatch(/^assets-populate-runtime:/m);
  });

  it("assets-build target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-build:.*## /m);
  });

  it("assets-validate target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-validate:.*## /m);
  });

  it("assets-export-web target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-export-web:.*## /m);
  });

  it("assets-populate-runtime target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-populate-runtime:.*## /m);
  });

  it("assets-build target calls the backing script", () => {
    expect(makefile).toContain("scripts/assets/assets-build.sh");
  });

  it("assets-validate target calls the backing script", () => {
    expect(makefile).toContain("scripts/assets/assets-validate.sh");
  });

  it("assets-export-web target calls the backing script", () => {
    expect(makefile).toContain("scripts/assets/assets-export-web.sh");
  });

  it("assets-populate-runtime target calls the backing script", () => {
    expect(makefile).toContain("scripts/assets/populate-office-runtime-glbs.mjs");
  });

  it("asset pipeline targets are declared .PHONY", () => {
    // The .PHONY line may span multiple physical lines via backslash continuation.
    const phonySections = makefile.replace(/\\\n\s*/g, " ");
    const phonyLine = phonySections
      .split("\n")
      .filter((l) => l.startsWith(".PHONY"))
      .join(" ");
    expect(phonyLine).toContain("assets-build");
    expect(phonyLine).toContain("assets-validate");
    expect(phonyLine).toContain("assets-export-web");
    expect(phonyLine).toContain("assets-populate-runtime");
  });
});

// ── Documentation ─────────────────────────────────────────────────────────────

describe("asset pipeline — documentation", () => {
  const docPath = repoPath("docs/asset-pipeline.md");

  it("docs/asset-pipeline.md exists", () => {
    expect(existsSync(docPath)).toBe(true);
  });

  const doc = existsSync(docPath) ? readFileSync(docPath, "utf-8") : "";

  it("documents make assets-build", () => {
    expect(doc).toContain("make assets-build");
  });

  it("documents make assets-validate", () => {
    expect(doc).toContain("make assets-validate");
  });

  it("documents make assets-export-web", () => {
    expect(doc).toContain("make assets-export-web");
  });

  it("documents make assets-populate-runtime", () => {
    expect(doc).toContain("make assets-populate-runtime");
  });

  it("explains canonical USD vs web GLB distinction", () => {
    expect(doc.toLowerCase()).toContain("canonical");
    expect(doc.toLowerCase()).toContain("glb");
    expect(doc.toLowerCase()).toContain("usd");
  });

  it("explains Blender as optional tool with install instructions", () => {
    expect(doc).toContain("Blender");
    expect(doc).toMatch(/brew install|blender\.org\/download/);
  });

  it("explains usd-core as optional tool with install instructions", () => {
    expect(doc).toContain("usd-core");
    expect(doc).toContain("pip install usd-core");
  });

  it("states GPU/Omniverse are not required", () => {
    const lower = doc.toLowerCase();
    // The doc must mention GPU *and* state that it is not required.
    // We check both words are present (markdown bold may split "not required").
    expect(lower).toContain("gpu");
    expect(lower).toContain("not");
    expect(lower).toContain("required");
  });
});

// ── Directory layout ───────────────────────────────────────────────────────────

describe("asset pipeline — directory layout", () => {
  it("assets/sources/office/manifest.json exists", () => {
    expect(existsSync(repoPath("assets/sources/office/manifest.json"))).toBe(true);
  });

  it("assets/usd/office/ directory exists", () => {
    expect(existsSync(repoPath("assets/usd/office"))).toBe(true);
  });

  it("assets/exports/web/office/ directory exists", () => {
    expect(existsSync(repoPath("assets/exports/web/office"))).toBe(true);
  });

  it("web/public/assets/office/ directory exists", () => {
    expect(existsSync(repoPath("web/public/assets/office"))).toBe(true);
  });
});

// ── Web export helpers ────────────────────────────────────────────────────────

describe("asset pipeline — web export helper scripts", () => {
  it("blender_export_glb.py exists", () => {
    expect(existsSync(repoPath("scripts/assets/blender_export_glb.py"))).toBe(true);
  });

  it("populate-office-runtime-glbs.mjs exists", () => {
    expect(existsSync(repoPath("scripts/assets/populate-office-runtime-glbs.mjs"))).toBe(
      true,
    );
  });

  it("populate-office-runtime-glbs.mjs is executable", () => {
    const mode = statSync(
      repoPath("scripts/assets/populate-office-runtime-glbs.mjs"),
    ).mode;
    expect(mode & 0o100).toBeTruthy();
  });

  it("populate-office-runtime-glbs.mjs documents Kenney and local generated props", () => {
    const content = readFileSync(
      repoPath("scripts/assets/populate-office-runtime-glbs.mjs"),
      "utf-8",
    );
    expect(content).toContain("KENNEY_FURNITURE_KIT_ZIP");
    expect(content).toContain("createCoffeeCupGlb");
    expect(content).toContain("createNotebookGlb");
  });

  it("build-export-map.py exists", () => {
    expect(existsSync(repoPath("scripts/assets/build-export-map.py"))).toBe(true);
  });

  it("blender_export_glb.py has a Python docstring describing its purpose", () => {
    const content = readFileSync(
      repoPath("scripts/assets/blender_export_glb.py"),
      "utf-8",
    );
    expect(content).toContain("blender");
    expect(content.toLowerCase()).toContain("usd");
    expect(content.toLowerCase()).toContain("glb");
  });

  it("blender_export_glb.py uses bpy for Blender integration", () => {
    const content = readFileSync(
      repoPath("scripts/assets/blender_export_glb.py"),
      "utf-8",
    );
    expect(content).toContain("import bpy");
  });

  it("build-export-map.py has a Python shebang", () => {
    const content = readFileSync(repoPath("scripts/assets/build-export-map.py"), "utf-8");
    expect(content.startsWith("#!/usr/bin/env python3")).toBe(true);
  });

  it("build-export-map.py is executable", () => {
    const mode = statSync(repoPath("scripts/assets/build-export-map.py")).mode;
    expect(mode & 0o100).toBeTruthy();
  });

  it("assets-export-web.sh references blender_export_glb.py", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("blender_export_glb.py");
  });

  it("assets-export-web.sh references build-export-map.py", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("build-export-map.py");
  });

  it("assets-export-web.sh documents the two-step export+sync pipeline", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content.toLowerCase()).toContain("sync");
    expect(content.toLowerCase()).toContain("export");
    expect(content).toContain("web/public/assets/office");
  });

  it("assets-export-web.sh uses content-based sync (cmp -s) to avoid timestamp churn", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("cmp -s");
  });

  it("assets-export-web.sh uses non-interactive copy flags (-f)", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("cp -f");
  });

  it("assets-export-web.sh supports --dry-run flag", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("--dry-run");
    expect(content).toContain("DRY_RUN");
  });

  it("assets-export-web.sh emits a clear error when Blender is missing", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("Blender is required");
    expect(content).toContain("blender.org/download");
  });

  it("assets-export-web.sh uses WEB_PUBLIC_OFFICE_DIR from common.sh", () => {
    const content = readFileSync(
      repoPath("scripts/assets/assets-export-web.sh"),
      "utf-8",
    );
    expect(content).toContain("WEB_PUBLIC_OFFICE_DIR");
  });

  it("common.sh defines WEB_PUBLIC_OFFICE_DIR", () => {
    const content = readFileSync(repoPath("scripts/assets/common.sh"), "utf-8");
    expect(content).toContain("WEB_PUBLIC_OFFICE_DIR");
    expect(content).toContain("web/public/assets/office");
  });
});

// ── build-export-map.py output ────────────────────────────────────────────────

describe("asset pipeline — build-export-map.py produces correct TSV map", () => {
  // Run build-export-map.py once and cache the output for all sub-tests.
  let mapLines: string[] = [];
  let mapRunError: string | null = null;

  try {
    const output = execSync(`python3 ${repoPath("scripts/assets/build-export-map.py")}`, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
    });
    mapLines = output.trim().split("\n").filter(Boolean);
  } catch (err) {
    mapRunError = String(err);
  }

  it("build-export-map.py runs without error", () => {
    expect(mapRunError).toBeNull();
  });

  it("produces exactly 10 export entries (one per web asset)", () => {
    expect(mapLines).toHaveLength(10);
  });

  it("every line has exactly 4 tab-separated fields", () => {
    for (const line of mapLines) {
      const fields = line.split("\t");
      expect(fields).toHaveLength(4);
    }
  });

  it("every propFile field references an existing USDA file", () => {
    for (const line of mapLines) {
      const [propFile] = line.split("\t");
      expect(propFile).not.toBe("");
      expect(existsSync(repoPath(propFile))).toBe(true);
    }
  });

  it("every webId field starts with 'office-'", () => {
    for (const line of mapLines) {
      const [, webId] = line.split("\t");
      expect(webId).toMatch(/^office-/);
    }
  });

  it("every exportPath points inside assets/exports/web/office/", () => {
    for (const line of mapLines) {
      const [, , exportPath] = line.split("\t");
      expect(exportPath).toMatch(/^assets\/exports\/web\/office\//);
      expect(exportPath).toMatch(/\.glb$/);
    }
  });

  it("every webPublicPath points inside web/public/assets/office/", () => {
    for (const line of mapLines) {
      const [, , , webPublicPath] = line.split("\t");
      expect(webPublicPath).toMatch(/^web\/public\/assets\/office\//);
      expect(webPublicPath).toMatch(/\.glb$/);
    }
  });

  it("webId matches the GLB filename in exportPath", () => {
    for (const line of mapLines) {
      const [, webId, exportPath] = line.split("\t");
      expect(exportPath).toContain(`/${webId}.glb`);
    }
  });

  it("webId matches the GLB filename in webPublicPath", () => {
    for (const line of mapLines) {
      const [, webId, , webPublicPath] = line.split("\t");
      expect(webPublicPath).toContain(`/${webId}.glb`);
    }
  });

  it("all 10 web asset IDs from web-asset-map.json are present in the output", () => {
    const webAssetMapRaw = readFileSync(
      repoPath("assets/usd/office/web-asset-map.json"),
      "utf-8",
    );
    const webAssetMap = JSON.parse(webAssetMapRaw) as { entries: { webId: string }[] };
    const expectedWebIds = webAssetMap.entries.map((e) => e.webId);
    const actualWebIds = mapLines.map((l) => l.split("\t")[1]);
    for (const expected of expectedWebIds) {
      expect(actualWebIds).toContain(expected);
    }
  });
});

// ── Web public GLB coverage ───────────────────────────────────────────────────

describe("asset pipeline — web/public/assets/office/ GLB coverage", () => {
  const webAssetMapRaw = existsSync(repoPath("assets/usd/office/web-asset-map.json"))
    ? readFileSync(repoPath("assets/usd/office/web-asset-map.json"), "utf-8")
    : "{}";
  const webAssetMap = JSON.parse(webAssetMapRaw) as {
    entries?: { webId: string }[];
  };
  const webIds = webAssetMap.entries?.map((e) => e.webId) ?? [];

  it.each(webIds)("web/public/assets/office/%s.glb exists", (webId) => {
    expect(existsSync(repoPath(`web/public/assets/office/${webId}.glb`))).toBe(true);
  });

  it.each(webIds)(
    "web/public/assets/office/%s.glb contains mesh-backed GLB data",
    (webId) => {
      const glbPath = repoPath(`web/public/assets/office/${webId}.glb`);
      const stats = statSync(glbPath);
      expect(stats.size).toBeGreaterThan(512);

      const { json, binChunkLength } = parseGlbFile(glbPath);
      const meshes = json.meshes ?? [];
      const nodes = json.nodes ?? [];
      const buffers = json.buffers ?? [];
      const accessors = json.accessors ?? [];

      expect(json.asset?.version).toBe("2.0");
      expect(nodes.length).toBeGreaterThan(0);
      expect(meshes.length).toBeGreaterThan(0);
      expect(buffers[0]?.byteLength ?? 0).toBeGreaterThan(0);
      expect(binChunkLength).toBeGreaterThan(0);
      expect(binChunkLength).toBeGreaterThanOrEqual(buffers[0]?.byteLength ?? 0);

      const primitives = meshes.flatMap((mesh) => mesh.primitives ?? []);
      expect(primitives.length).toBeGreaterThan(0);

      const positionAccessorIds = primitives
        .map((primitive) => primitive.attributes?.POSITION)
        .filter((id): id is number => typeof id === "number");
      expect(positionAccessorIds.length).toBeGreaterThan(0);

      for (const accessorId of positionAccessorIds) {
        const accessor = accessors[accessorId];
        expect(accessor).toBeDefined();
        expect(accessor.type).toBe("VEC3");
        expect(accessor.componentType).toBe(5126);
        expect(accessor.count ?? 0).toBeGreaterThan(0);
        expect(typeof accessor.bufferView).toBe("number");
      }
    },
  );

  it.each(webIds)(
    "assets/exports/web/office/%s.glb matches the runtime public asset",
    (webId) => {
      const exportBytes = readFileSync(
        repoPath(`assets/exports/web/office/${webId}.glb`),
      );
      const publicBytes = readFileSync(repoPath(`web/public/assets/office/${webId}.glb`));
      expect(exportBytes.equals(publicBytes)).toBe(true);
    },
  );

  it("all 10 web asset GLB files are present", () => {
    expect(webIds).toHaveLength(10);
    for (const webId of webIds) {
      expect(existsSync(repoPath(`web/public/assets/office/${webId}.glb`))).toBe(true);
    }
  });
});
