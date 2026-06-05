#!/usr/bin/env node
// Populate the checked-in runtime GLBs for the MVP office scene.
//
// Inputs:
//   - Kenney Furniture Kit ZIP, defaulting to /tmp/aethel-assets/kenney_furniture-kit.zip
//
// Outputs:
//   - assets/exports/web/office/*.glb
//   - web/public/assets/office/*.glb
//
// The Kenney GLBs are wrapped in a root transform so each model is bottom-
// centered and matches the dimensions used by the typed runtime manifest.
// The coffee cup and notebook are deterministic local low-poly meshes because
// the Eclair pack is not committed to this repository.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const KENNEY_ZIP =
  process.env.KENNEY_FURNITURE_KIT_ZIP ??
  "/tmp/aethel-assets/kenney_furniture-kit.zip";

const EXPORT_DIR = resolve(REPO_ROOT, "assets/exports/web/office");
const WEB_PUBLIC_DIR = resolve(REPO_ROOT, "web/public/assets/office");

const KENNEY_ASSETS = [
  {
    webId: "office-desk",
    zipPath: "Models/GLTF format/desk.glb",
    dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
  },
  {
    webId: "office-chair",
    zipPath: "Models/GLTF format/chairDesk.glb",
    dimensions: { width: 0.6, height: 0.9, depth: 0.6 },
  },
  {
    webId: "office-laptop",
    zipPath: "Models/GLTF format/laptop.glb",
    dimensions: { width: 0.35, height: 0.22, depth: 0.32 },
  },
  {
    webId: "office-keyboard",
    zipPath: "Models/GLTF format/computerKeyboard.glb",
    dimensions: { width: 0.45, height: 0.03, depth: 0.15 },
  },
  {
    webId: "office-monitor",
    zipPath: "Models/GLTF format/computerScreen.glb",
    dimensions: { width: 0.5, height: 0.4, depth: 0.2 },
  },
  {
    webId: "office-trash-can",
    zipPath: "Models/GLTF format/trashcan.glb",
    dimensions: { width: 0.3, height: 0.45, depth: 0.3 },
  },
  {
    webId: "office-desk-lamp",
    zipPath: "Models/GLTF format/lampSquareTable.glb",
    dimensions: { width: 0.15, height: 0.5, depth: 0.15 },
  },
  {
    webId: "office-book-stack",
    zipPath: "Models/GLTF format/books.glb",
    dimensions: { width: 0.15, height: 0.2, depth: 0.1 },
  },
];

const GENERATED_ASSETS = [
  {
    webId: "office-coffee-cup",
    create: createCoffeeCupGlb,
  },
  {
    webId: "office-notebook",
    create: createNotebookGlb,
  },
];

function align4(n) {
  return (n + 3) & ~3;
}

function padBuffer(buffer, padByte) {
  const padded = Buffer.alloc(align4(buffer.length), padByte);
  buffer.copy(padded);
  return padded;
}

function readZipEntry(zipPath, entryPath) {
  return execFileSync("unzip", ["-p", zipPath, entryPath], {
    cwd: REPO_ROOT,
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseGlb(buffer) {
  if (buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error("Not a GLB file: missing glTF magic");
  }
  const version = buffer.readUInt32LE(4);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version: ${version}`);
  }

  let offset = 12;
  let json = null;
  let bin = Buffer.alloc(0);

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(buffer.subarray(chunkStart, chunkEnd).toString("utf8").trim());
    } else if (chunkType === 0x004e4942) {
      bin = buffer.subarray(chunkStart, chunkEnd);
    }

    offset = chunkEnd;
  }

  if (!json) {
    throw new Error("GLB did not contain a JSON chunk");
  }

  return { json, bin };
}

function writeGlb(json, bin) {
  const jsonChunk = padBuffer(Buffer.from(JSON.stringify(json), "utf8"), 0x20);
  const binChunk = padBuffer(bin, 0x00);
  const totalLength = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const out = Buffer.alloc(totalLength);

  out.write("glTF", 0, 4, "utf8");
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(totalLength, 8);

  let offset = 12;
  out.writeUInt32LE(jsonChunk.length, offset);
  out.writeUInt32LE(0x4e4f534a, offset + 4);
  jsonChunk.copy(out, offset + 8);
  offset += 8 + jsonChunk.length;

  out.writeUInt32LE(binChunk.length, offset);
  out.writeUInt32LE(0x004e4942, offset + 4);
  binChunk.copy(out, offset + 8);

  return out;
}

function accessorBounds(gltf, bin, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor) {
    throw new Error(`Missing accessor ${accessorIndex}`);
  }
  if (accessor.componentType !== 5126 || accessor.type !== "VEC3") {
    throw new Error(`Accessor ${accessorIndex} is not FLOAT VEC3`);
  }

  if (Array.isArray(accessor.min) && Array.isArray(accessor.max)) {
    return { min: accessor.min, max: accessor.max };
  }

  const view = gltf.bufferViews?.[accessor.bufferView];
  if (!view) {
    throw new Error(`Missing bufferView ${accessor.bufferView}`);
  }

  const stride = view.byteStride ?? 12;
  const byteOffset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (let i = 0; i < accessor.count; i += 1) {
    const base = byteOffset + i * stride;
    for (let c = 0; c < 3; c += 1) {
      const value = bin.readFloatLE(base + c * 4);
      min[c] = Math.min(min[c], value);
      max[c] = Math.max(max[c], value);
    }
  }

  return { min, max };
}

function meshPositionBounds(gltf, bin) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let positionAccessorCount = 0;

  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const positionAccessor = primitive.attributes?.POSITION;
      if (positionAccessor === undefined) {
        continue;
      }
      const bounds = accessorBounds(gltf, bin, positionAccessor);
      positionAccessorCount += 1;
      for (let c = 0; c < 3; c += 1) {
        min[c] = Math.min(min[c], bounds.min[c]);
        max[c] = Math.max(max[c], bounds.max[c]);
      }
    }
  }

  if (positionAccessorCount === 0) {
    throw new Error("GLB has no mesh POSITION accessors");
  }

  return { min, max, size: max.map((value, i) => value - min[i]) };
}

function wrapWithRuntimeTransform(gltf, bin, dimensions, webId) {
  const bounds = meshPositionBounds(gltf, bin);
  const scale = [
    dimensions.width / bounds.size[0],
    dimensions.height / bounds.size[1],
    dimensions.depth / bounds.size[2],
  ];
  const translation = [
    -((bounds.min[0] + bounds.max[0]) / 2) * scale[0],
    -bounds.min[1] * scale[1],
    -((bounds.min[2] + bounds.max[2]) / 2) * scale[2],
  ];

  const sceneIndex = gltf.scene ?? 0;
  gltf.scene = sceneIndex;
  gltf.scenes ??= [{ nodes: [] }];
  gltf.scenes[sceneIndex] ??= { nodes: [] };
  gltf.nodes ??= [];

  const originalRoots = [...(gltf.scenes[sceneIndex].nodes ?? [])];
  const runtimeRootIndex = gltf.nodes.length;
  gltf.nodes.push({
    name: `AethelRuntimeRoot_${webId}`,
    translation: translation.map(roundFloat),
    scale: scale.map(roundFloat),
    children: originalRoots,
  });
  gltf.scenes[sceneIndex].nodes = [runtimeRootIndex];
  gltf.asset ??= { version: "2.0" };
  gltf.asset.generator = "Aethel office runtime asset normalizer";

  return gltf;
}

function roundFloat(value) {
  return Number(value.toFixed(6));
}

function createPrimitiveBuilder(assetName, materials) {
  const json = {
    asset: {
      version: "2.0",
      generator: "Aethel local office prop generator",
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: assetName, mesh: 0 }],
    meshes: [{ name: `${assetName}Mesh`, primitives: [] }],
    materials: materials.map((material) => ({
      name: material.name,
      pbrMetallicRoughness: {
        baseColorFactor: material.baseColorFactor,
        metallicFactor: 0,
        roughnessFactor: 0.75,
      },
    })),
    buffers: [{ byteLength: 0 }],
    bufferViews: [],
    accessors: [],
  };
  const parts = [];
  let byteOffset = 0;

  function appendAligned(buffer) {
    const pad = align4(byteOffset) - byteOffset;
    if (pad > 0) {
      parts.push(Buffer.alloc(pad));
      byteOffset += pad;
    }
    const viewIndex = json.bufferViews.length;
    json.bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buffer.length,
    });
    parts.push(buffer);
    byteOffset += buffer.length;
    return viewIndex;
  }

  function addAccessor(buffer, descriptor) {
    const bufferView = appendAligned(buffer);
    const accessorIndex = json.accessors.length;
    json.accessors.push({
      bufferView,
      byteOffset: 0,
      componentType: descriptor.componentType,
      count: descriptor.count,
      type: descriptor.type,
      ...(descriptor.min ? { min: descriptor.min.map(roundFloat) } : {}),
      ...(descriptor.max ? { max: descriptor.max.map(roundFloat) } : {}),
    });
    return accessorIndex;
  }

  function addPrimitive({ positions, normals, indices, material }) {
    const positionBounds = boundsForPositions(positions);
    const positionAccessor = addAccessor(floatBuffer(positions), {
      componentType: 5126,
      count: positions.length / 3,
      type: "VEC3",
      min: positionBounds.min,
      max: positionBounds.max,
    });
    const normalAccessor = addAccessor(floatBuffer(normals), {
      componentType: 5126,
      count: normals.length / 3,
      type: "VEC3",
    });
    const indexAccessor = addAccessor(uint16Buffer(indices), {
      componentType: 5123,
      count: indices.length,
      type: "SCALAR",
      min: [Math.min(...indices)],
      max: [Math.max(...indices)],
    });

    json.meshes[0].primitives.push({
      attributes: {
        POSITION: positionAccessor,
        NORMAL: normalAccessor,
      },
      indices: indexAccessor,
      material,
    });
  }

  function finish() {
    const bin = Buffer.concat(parts);
    json.buffers[0].byteLength = bin.length;
    return writeGlb(json, bin);
  }

  return { addPrimitive, finish };
}

function floatBuffer(values) {
  return Buffer.from(new Float32Array(values).buffer);
}

function uint16Buffer(values) {
  return Buffer.from(new Uint16Array(values).buffer);
}

function boundsForPositions(positions) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let c = 0; c < 3; c += 1) {
      const value = positions[i + c];
      min[c] = Math.min(min[c], value);
      max[c] = Math.max(max[c], value);
    }
  }
  return { min, max };
}

function addBox(builder, center, size, material) {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size.map((n) => n / 2);
  const corners = {
    l: cx - sx,
    r: cx + sx,
    b: cy - sy,
    t: cy + sy,
    f: cz - sz,
    k: cz + sz,
  };
  const faces = [
    {
      normal: [1, 0, 0],
      points: [
        [corners.r, corners.b, corners.f],
        [corners.r, corners.t, corners.f],
        [corners.r, corners.t, corners.k],
        [corners.r, corners.b, corners.k],
      ],
    },
    {
      normal: [-1, 0, 0],
      points: [
        [corners.l, corners.b, corners.k],
        [corners.l, corners.t, corners.k],
        [corners.l, corners.t, corners.f],
        [corners.l, corners.b, corners.f],
      ],
    },
    {
      normal: [0, 1, 0],
      points: [
        [corners.l, corners.t, corners.f],
        [corners.l, corners.t, corners.k],
        [corners.r, corners.t, corners.k],
        [corners.r, corners.t, corners.f],
      ],
    },
    {
      normal: [0, -1, 0],
      points: [
        [corners.l, corners.b, corners.k],
        [corners.l, corners.b, corners.f],
        [corners.r, corners.b, corners.f],
        [corners.r, corners.b, corners.k],
      ],
    },
    {
      normal: [0, 0, 1],
      points: [
        [corners.r, corners.b, corners.k],
        [corners.r, corners.t, corners.k],
        [corners.l, corners.t, corners.k],
        [corners.l, corners.b, corners.k],
      ],
    },
    {
      normal: [0, 0, -1],
      points: [
        [corners.l, corners.b, corners.f],
        [corners.l, corners.t, corners.f],
        [corners.r, corners.t, corners.f],
        [corners.r, corners.b, corners.f],
      ],
    },
  ];

  const positions = [];
  const normals = [];
  const indices = [];

  for (const face of faces) {
    const start = positions.length / 3;
    for (const point of face.points) {
      positions.push(...point);
      normals.push(...face.normal);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }

  builder.addPrimitive({ positions, normals, indices, material });
}

function addCylinderSide(builder, radius, yMin, yMax, segments, material) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const normal = [Math.cos(angle), 0, Math.sin(angle)];
    positions.push(x, yMin, z, x, yMax, z);
    normals.push(...normal, ...normal);
  }

  for (let i = 0; i < segments; i += 1) {
    const start = i * 2;
    indices.push(start, start + 1, start + 3, start, start + 3, start + 2);
  }

  builder.addPrimitive({ positions, normals, indices, material });
}

function addDisk(builder, radius, y, segments, material, normalY = 1) {
  const positions = [0, y, 0];
  const normals = [0, normalY, 0];
  const indices = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    normals.push(0, normalY, 0);
  }

  for (let i = 1; i <= segments; i += 1) {
    const next = i === segments ? 1 : i + 1;
    if (normalY > 0) {
      indices.push(0, i, next);
    } else {
      indices.push(0, next, i);
    }
  }

  builder.addPrimitive({ positions, normals, indices, material });
}

function createCoffeeCupGlb() {
  const builder = createPrimitiveBuilder("AethelCoffeeCup", [
    { name: "warm white ceramic", baseColorFactor: [0.93, 0.9, 0.84, 1] },
    { name: "dark coffee", baseColorFactor: [0.18, 0.1, 0.04, 1] },
  ]);

  addCylinderSide(builder, 0.03, 0.004, 0.09, 24, 0);
  addDisk(builder, 0.029, 0.004, 24, 0, -1);
  addDisk(builder, 0.024, 0.088, 24, 1, 1);
  addBox(builder, [0.034, 0.066, 0], [0.016, 0.012, 0.018], 0);
  addBox(builder, [0.034, 0.038, 0], [0.016, 0.012, 0.018], 0);
  addBox(builder, [0.043, 0.052, 0], [0.012, 0.04, 0.018], 0);

  return builder.finish();
}

function createNotebookGlb() {
  const builder = createPrimitiveBuilder("AethelNotebook", [
    { name: "paper pages", baseColorFactor: [0.96, 0.94, 0.86, 1] },
    { name: "blue cover", baseColorFactor: [0.1, 0.32, 0.62, 1] },
    { name: "black spiral", baseColorFactor: [0.02, 0.02, 0.025, 1] },
  ]);

  addBox(builder, [0, 0.006, 0], [0.19, 0.012, 0.14], 0);
  addBox(builder, [0.006, 0.014, 0], [0.188, 0.004, 0.15], 1);
  addBox(builder, [-0.09, 0.019, 0], [0.018, 0.006, 0.15], 1);

  for (const z of [-0.058, -0.035, -0.012, 0.012, 0.035, 0.058]) {
    addBox(builder, [-0.101, 0.024, z], [0.014, 0.006, 0.01], 2);
  }

  return builder.finish();
}

function writeAsset(webId, glbBuffer) {
  for (const dir of [EXPORT_DIR, WEB_PUBLIC_DIR]) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${webId}.glb`), glbBuffer);
  }
}

function main() {
  if (!existsSync(KENNEY_ZIP)) {
    throw new Error(
      `Kenney ZIP not found: ${KENNEY_ZIP}\n` +
        "Download it first or set KENNEY_FURNITURE_KIT_ZIP.",
    );
  }

  for (const asset of KENNEY_ASSETS) {
    const sourceBuffer = readZipEntry(KENNEY_ZIP, asset.zipPath);
    const { json, bin } = parseGlb(sourceBuffer);
    const normalizedJson = wrapWithRuntimeTransform(
      json,
      bin,
      asset.dimensions,
      asset.webId,
    );
    writeAsset(asset.webId, writeGlb(normalizedJson, bin));
    console.log(`wrote ${asset.webId} from Kenney ${asset.zipPath}`);
  }

  for (const asset of GENERATED_ASSETS) {
    writeAsset(asset.webId, asset.create());
    console.log(`wrote ${asset.webId} from local generator`);
  }
}

main();
