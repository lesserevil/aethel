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
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

// Path from web/src/assets/ up to the repo root.
const REPO_ROOT = resolve(__dirname, "../../..");

function repoPath(...parts: string[]): string {
  return resolve(REPO_ROOT, ...parts);
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

  it("assets-build target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-build:.*## /m);
  });

  it("assets-validate target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-validate:.*## /m);
  });

  it("assets-export-web target has a ## help comment", () => {
    expect(makefile).toMatch(/^assets-export-web:.*## /m);
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

  it("all three targets are declared .PHONY", () => {
    // The .PHONY line may span multiple physical lines via backslash continuation.
    const phonySections = makefile.replace(/\\\n\s*/g, " ");
    const phonyLine = phonySections
      .split("\n")
      .filter((l) => l.startsWith(".PHONY"))
      .join(" ");
    expect(phonyLine).toContain("assets-build");
    expect(phonyLine).toContain("assets-validate");
    expect(phonyLine).toContain("assets-export-web");
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
});
