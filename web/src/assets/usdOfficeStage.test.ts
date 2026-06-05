// Tests for the canonical OpenUSD office stage under assets/usd/office/.
//
// These tests verify the *structural* content of the USD stage files without
// requiring usd-core, Blender, or any NVIDIA tooling.  They parse the USDA
// (plain-text ASCII) format directly.
//
// Related files:
//   assets/usd/office/office.usda          — root stage
//   assets/usd/office/props/*.usda         — individual prop assets
//   scripts/assets/validate-usd-stage.py   — Python structural validator
//
// HOW TO VERIFY
//   cd web && bun run test -- usdOfficeStage
//
// WHAT IS CHECKED
//   - office.usda and all required prop files exist
//   - office.usda has the correct stage-level metadata (defaultPrim, upAxis, metersPerUnit)
//   - office.usda defines every required /World scope (Office, Architecture,
//     Furniture, Devices, Containers, Clutter, Lights, Cameras)
//   - office.usda contains prepend references to every prop file
//   - office.usda defines a Camera prim named OfficeCamera
//   - office.usda defines light prims AmbientDome and KeyLight
//   - each prop USDA has the correct defaultPrim, metersPerUnit, and upAxis
//   - each prop USDA embeds source, license, and assetId in customData
//   - each prop USDA matches the manifest.json usdPrimPath and licenseId

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Path from web/src/assets/ up to the repo root.
const REPO_ROOT = resolve(__dirname, "../../..");

function repoPath(...parts: string[]): string {
  return resolve(REPO_ROOT, ...parts);
}

// ── File paths ───────────────────────────────────────────────────────────────

const STAGE_PATH = repoPath("assets/usd/office/office.usda");
const PROPS_DIR = repoPath("assets/usd/office/props");
const VALIDATE_SCRIPT = repoPath("scripts/assets/validate-usd-stage.py");

// ── Prop catalogue (derived from assets/sources/office/manifest.json) ────────
//
// Each entry maps the prop's manifest assetId to its expected USDA file name
// and the prim name that will be the defaultPrim.

interface PropSpec {
  /** Manifest assetId */
  id: string;
  /** File name under assets/usd/office/props/ */
  file: string;
  /** defaultPrim value (the root prim name inside the file) */
  defaultPrim: string;
  /** Expected USD prim path for this prop from manifest.json */
  usdPrimPath: string;
  /** Source ID */
  sourceId: string;
  /** License ID */
  licenseId: string;
}

const PROP_SPECS: PropSpec[] = [
  {
    id: "desk",
    file: "desk.usda",
    defaultPrim: "Desk",
    usdPrimPath: "/World/Office/Furniture/Desk",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "deskChair",
    file: "desk_chair.usda",
    defaultPrim: "DeskChair",
    usdPrimPath: "/World/Office/Furniture/DeskChair",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "laptop",
    file: "laptop.usda",
    defaultPrim: "Laptop",
    usdPrimPath: "/World/Office/Devices/Laptop",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "keyboard",
    file: "keyboard.usda",
    defaultPrim: "Keyboard",
    usdPrimPath: "/World/Office/Devices/Keyboard",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "monitorWide",
    file: "monitor_wide.usda",
    defaultPrim: "MonitorWide",
    usdPrimPath: "/World/Office/Devices/MonitorWide",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "trashCan",
    file: "trash_can.usda",
    defaultPrim: "TrashCan",
    usdPrimPath: "/World/Office/Containers/TrashCan",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "lampDesk",
    file: "lamp_desk.usda",
    defaultPrim: "LampDesk",
    usdPrimPath: "/World/Office/Furniture/LampDesk",
    sourceId: "kenney-furniture-kit",
    licenseId: "cc0-1.0",
  },
  {
    id: "mug",
    file: "mug.usda",
    defaultPrim: "Mug",
    usdPrimPath: "/World/Office/Clutter/Mug",
    sourceId: "eclair-home-desk-props",
    licenseId: "cc0-1.0",
  },
  {
    id: "book",
    file: "book.usda",
    defaultPrim: "Book",
    usdPrimPath: "/World/Office/Clutter/Book",
    sourceId: "eclair-home-desk-props",
    licenseId: "cc0-1.0",
  },
  {
    id: "notebook",
    file: "notebook.usda",
    defaultPrim: "Notebook",
    usdPrimPath: "/World/Office/Clutter/Notebook",
    sourceId: "eclair-home-desk-props",
    licenseId: "cc0-1.0",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read a USDA file or return empty string with a test fail if missing. */
function readUsda(path: string): string {
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

/** Extract all prim names defined with `def <Type> "Name"` in a USDA text. */
function definedPrimNames(usda: string): Set<string> {
  const names = new Set<string>();
  for (const m of usda.matchAll(/\bdef\s+\w+\s+"(\w+)"/g)) {
    names.add(m[1]);
  }
  return names;
}

/** Extract the stage-level metadata block (the ( ... ) after `#usda 1.0`). */
function stageMetadataBlock(usda: string): string {
  const headerMatch = usda.match(/#usda\s+1\.0\s*\(/);
  if (!headerMatch) return "";
  const start = headerMatch.index! + headerMatch[0].length;
  let depth = 1;
  let idx = start;
  while (idx < usda.length && depth > 0) {
    if (usda[idx] === "(") depth++;
    else if (usda[idx] === ")") depth--;
    idx++;
  }
  return usda.slice(start, idx - 1);
}

// ── Stage: file existence ─────────────────────────────────────────────────────

describe("USD office stage — file existence", () => {
  it("assets/usd/office/office.usda exists", () => {
    expect(existsSync(STAGE_PATH)).toBe(true);
  });

  it("assets/usd/office/props/ directory exists", () => {
    expect(existsSync(PROPS_DIR)).toBe(true);
  });

  it("scripts/assets/validate-usd-stage.py exists", () => {
    expect(existsSync(VALIDATE_SCRIPT)).toBe(true);
  });

  it.each(PROP_SPECS)("prop file exists: props/$file", ({ file }) => {
    expect(existsSync(resolve(PROPS_DIR, file))).toBe(true);
  });
});

// ── Stage: USDA format ────────────────────────────────────────────────────────

describe("USD office stage — USDA file format", () => {
  const stage = readUsda(STAGE_PATH);

  it("office.usda starts with #usda 1.0", () => {
    expect(stage.startsWith("#usda 1.0")).toBe(true);
  });

  it('office.usda has defaultPrim = "World"', () => {
    const meta = stageMetadataBlock(stage);
    expect(meta).toMatch(/defaultPrim\s*=\s*"World"/);
  });

  it("office.usda has metersPerUnit = 1", () => {
    const meta = stageMetadataBlock(stage);
    expect(meta).toMatch(/metersPerUnit\s*=\s*1\b/);
  });

  it('office.usda has upAxis = "Y"', () => {
    const meta = stageMetadataBlock(stage);
    expect(meta).toMatch(/upAxis\s*=\s*"Y"/);
  });
});

// ── Stage: required prim hierarchy ───────────────────────────────────────────

describe("USD office stage — required prim hierarchy", () => {
  const stage = readUsda(STAGE_PATH);
  const names = definedPrimNames(stage);

  const REQUIRED_PRIMS = [
    "World",
    "Office",
    "Architecture",
    "Furniture",
    "Devices",
    "Containers",
    "Clutter",
    "Lights",
    "Cameras",
  ] as const;

  it.each(REQUIRED_PRIMS)("stage defines required prim: %s", (name) => {
    expect(names.has(name)).toBe(true);
  });
});

// ── Stage: lights ─────────────────────────────────────────────────────────────

describe("USD office stage — lights", () => {
  const stage = readUsda(STAGE_PATH);
  const names = definedPrimNames(stage);

  it('stage defines light prim "AmbientDome"', () => {
    expect(names.has("AmbientDome")).toBe(true);
  });

  it('stage defines light prim "KeyLight"', () => {
    expect(names.has("KeyLight")).toBe(true);
  });

  it("AmbientDome is a DomeLight", () => {
    expect(stage).toContain('def DomeLight "AmbientDome"');
  });

  it("KeyLight is a DistantLight or RectLight", () => {
    expect(stage).toMatch(/def (DistantLight|RectLight) "KeyLight"/);
  });
});

// ── Stage: camera ─────────────────────────────────────────────────────────────

describe("USD office stage — camera", () => {
  const stage = readUsda(STAGE_PATH);

  it('stage defines Camera "OfficeCamera"', () => {
    expect(stage).toContain('def Camera "OfficeCamera"');
  });

  it("OfficeCamera specifies focalLength", () => {
    // Find the OfficeCamera block and check for focalLength inside it.
    const camIdx = stage.indexOf('def Camera "OfficeCamera"');
    expect(camIdx).toBeGreaterThanOrEqual(0);
    const camBlock = stage.slice(camIdx, camIdx + 800);
    expect(camBlock).toContain("focalLength");
  });

  it("OfficeCamera specifies a clippingRange", () => {
    const camIdx = stage.indexOf('def Camera "OfficeCamera"');
    const camBlock = stage.slice(camIdx, camIdx + 800);
    expect(camBlock).toContain("clippingRange");
  });
});

// ── Stage: prop references ────────────────────────────────────────────────────

describe("USD office stage — prop references", () => {
  const stage = readUsda(STAGE_PATH);

  it.each(PROP_SPECS)("stage contains prepend references to props/$file", ({ file }) => {
    expect(stage).toContain(`props/${file}`);
  });
});

// ── Stage: coordinate convention documentation ────────────────────────────────

describe("USD office stage — coordinate convention documentation", () => {
  const stage = readUsda(STAGE_PATH);

  it("stage doc mentions Y-up", () => {
    expect(stage.toLowerCase()).toContain("y-up");
  });

  it("stage doc mentions meters", () => {
    expect(stage.toLowerCase()).toMatch(/meter/);
  });
});

// ── Props: USDA format ────────────────────────────────────────────────────────

describe("USD office stage — prop USDA format", () => {
  it.each(PROP_SPECS)("$file starts with #usda 1.0", ({ file }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text.startsWith("#usda 1.0")).toBe(true);
  });

  it.each(PROP_SPECS)("$file has metersPerUnit = 1", ({ file }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    const meta = stageMetadataBlock(text);
    expect(meta).toMatch(/metersPerUnit\s*=\s*1\b/);
  });

  it.each(PROP_SPECS)('$file has upAxis = "Y"', ({ file }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    const meta = stageMetadataBlock(text);
    expect(meta).toMatch(/upAxis\s*=\s*"Y"/);
  });

  it.each(PROP_SPECS)("$file has correct defaultPrim", ({ file, defaultPrim }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    const meta = stageMetadataBlock(text);
    expect(meta).toContain(`defaultPrim = "${defaultPrim}"`);
  });
});

// ── Props: source and license metadata ───────────────────────────────────────

describe("USD office stage — prop source/license metadata", () => {
  it.each(PROP_SPECS)("$file embeds assetId in customData", ({ file, id }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text).toContain(`assetId = "${id}"`);
  });

  it.each(PROP_SPECS)("$file embeds sourceId in customData", ({ file, sourceId }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text).toContain(`sourceId = "${sourceId}"`);
  });

  it.each(PROP_SPECS)("$file embeds licenseId in customData", ({ file, licenseId }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text).toContain(`licenseId = "${licenseId}"`);
  });

  it.each(PROP_SPECS)(
    "$file embeds usdPrimPath in customData",
    ({ file, usdPrimPath }) => {
      const text = readUsda(resolve(PROPS_DIR, file));
      expect(text).toContain(`usdPrimPath = "${usdPrimPath}"`);
    },
  );

  it.each(PROP_SPECS)("$file embeds a sourceUrl (https://)", ({ file }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text).toContain('sourceUrl = "https://');
  });

  it.each(PROP_SPECS)("$file embeds a licenseUrl (https://)", ({ file }) => {
    const text = readUsda(resolve(PROPS_DIR, file));
    expect(text).toContain('licenseUrl = "https://');
  });
});

// ── Props: default prim is defined ───────────────────────────────────────────

describe("USD office stage — prop default prim definition", () => {
  it.each(PROP_SPECS)(
    "$file defines the defaultPrim as an Xform",
    ({ file, defaultPrim }) => {
      const text = readUsda(resolve(PROPS_DIR, file));
      expect(text).toContain(`def Xform "${defaultPrim}"`);
    },
  );
});

// ── Validation script ─────────────────────────────────────────────────────────

describe("USD office stage — validation script", () => {
  const script = existsSync(VALIDATE_SCRIPT)
    ? readFileSync(VALIDATE_SCRIPT, "utf-8")
    : "";

  it("validate-usd-stage.py starts with a Python shebang", () => {
    expect(script.startsWith("#!/usr/bin/env python3")).toBe(true);
  });

  it("validate-usd-stage.py checks for defaultPrim", () => {
    expect(script).toContain("defaultPrim");
  });

  it("validate-usd-stage.py checks for metersPerUnit", () => {
    expect(script).toContain("metersPerUnit");
  });

  it("validate-usd-stage.py checks for upAxis", () => {
    expect(script).toContain("upAxis");
  });

  it("validate-usd-stage.py checks required prop references", () => {
    expect(script).toContain("REQUIRED_PROP_REFS");
  });

  it("validate-usd-stage.py checks required prim names", () => {
    expect(script).toContain("REQUIRED_PRIM_NAMES");
  });

  it("validate-usd-stage.py checks for OfficeCamera", () => {
    expect(script).toContain("OfficeCamera");
  });
});
