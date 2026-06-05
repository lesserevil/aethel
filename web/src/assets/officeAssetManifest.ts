// Office Asset Manifest
//
// This file is the single source of truth for every office prop used in the
// Aethel MVP scene. All entries are plain serializable metadata — no Three.js
// objects, GLTF nodes, DOM handles, or provider clients.
//
// Sources:
//   Kenney Furniture Kit — https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z
//   Eclair Everyday Home & Desk Props — https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models
//
// License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/

import type { ColliderHint, Affordance } from "../state/sessionTypes";

// ── Manifest-specific types ───────────────────────────────────────────────────

/** Broad semantic category used for USD conversion and filtering. */
export type AssetCategory = "furniture" | "device" | "container" | "clutter";

/** Default scene placement transform. All positions in meters, rotations in degrees. */
export interface AssetTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

/** Approximate bounding box dimensions in meters. */
export interface AssetDimensions {
  width: number;
  height: number;
  depth: number;
}

// ── Manifest entry type ───────────────────────────────────────────────────────

export interface OfficeAssetEntry {
  /** Stable identifier used to reference this asset in SceneObjectState. */
  id: string;
  /** Human-readable display label. */
  label: string;
  /** Broad semantic category for grouping and USD pipeline hints. */
  category: AssetCategory;
  /** Runtime URL served from /assets/office/. */
  url: string;
  /** Name of the original asset source or pack. */
  sourceName: string;
  /** URL of the original asset source page for provenance. */
  sourceUrl: string;
  /** SPDX license identifier (e.g. "CC0-1.0"). */
  licenseId: string;
  /** URL of the full license text. */
  licenseUrl: string;
  /** Default scene placement transform. */
  defaultTransform: AssetTransform;
  /** Approximate bounding dimensions in meters. */
  dimensions: AssetDimensions;
  /** Simple collision shape hint for the USD/physics pipeline. */
  colliderHint: ColliderHint;
  /** Optional semantic affordances describing how this object can be used. */
  affordances?: Affordance[];
}

// ── Manifest entries ──────────────────────────────────────────────────────────

const KENNEY_SOURCE_NAME = "Kenney Furniture Kit";
const KENNEY_SOURCE_URL = "https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z";
const KENNEY_LICENSE_ID = "CC0-1.0";
const KENNEY_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const ECLAIR_SOURCE_NAME = "Eclair Everyday Home & Desk Props";
const ECLAIR_SOURCE_URL =
  "https://eclair-assets.itch.io/everyday-home-desk-props-glb-pack-30-free-cc0-3d-models";
const ECLAIR_LICENSE_ID = "CC0-1.0";
const ECLAIR_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const defaultScale = { x: 1, y: 1, z: 1 };
const noRotation = { x: 0, y: 0, z: 0 };

export const OFFICE_ASSET_MANIFEST: OfficeAssetEntry[] = [
  {
    id: "office-desk",
    label: "Office Desk",
    category: "furniture",
    url: "/assets/office/office-desk.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 1.4, height: 0.75, depth: 0.7 },
    colliderHint: "box",
    affordances: ["work-surface"],
  },
  {
    id: "office-chair",
    label: "Office Chair",
    category: "furniture",
    url: "/assets/office/office-chair.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0, y: 0, z: 0.9 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.6, height: 0.9, depth: 0.6 },
    colliderHint: "box",
    affordances: ["seatable"],
  },
  {
    id: "office-monitor",
    label: "Monitor",
    category: "device",
    url: "/assets/office/office-monitor.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.1, y: 0.76, z: -0.25 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.5, height: 0.4, depth: 0.2 },
    colliderHint: "box",
  },
  {
    id: "office-laptop",
    label: "Laptop",
    category: "device",
    url: "/assets/office/office-laptop.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: -0.3, y: 0.76, z: 0.05 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.35, height: 0.02, depth: 0.25 },
    colliderHint: "box",
    affordances: ["input-device"],
  },
  {
    id: "office-keyboard",
    label: "Keyboard",
    category: "device",
    url: "/assets/office/office-keyboard.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0, y: 0.76, z: 0.15 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.45, height: 0.03, depth: 0.15 },
    colliderHint: "box",
    affordances: ["input-device"],
  },
  {
    id: "office-trash-can",
    label: "Trash Can",
    category: "container",
    url: "/assets/office/office-trash-can.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.8, y: 0, z: 0.5 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.3, height: 0.45, depth: 0.3 },
    colliderHint: "cylinder",
    affordances: ["waste-container"],
  },
  {
    id: "office-desk-lamp",
    label: "Desk Lamp",
    category: "furniture",
    url: "/assets/office/office-desk-lamp.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.5, y: 0.76, z: -0.2 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.15, height: 0.5, depth: 0.15 },
    colliderHint: "convexHull",
    affordances: ["light-source"],
  },
  {
    id: "office-book-stack",
    label: "Book Stack",
    category: "clutter",
    url: "/assets/office/office-book-stack.glb",
    sourceName: ECLAIR_SOURCE_NAME,
    sourceUrl: ECLAIR_SOURCE_URL,
    licenseId: ECLAIR_LICENSE_ID,
    licenseUrl: ECLAIR_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.4, y: 0.76, z: -0.1 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.15, height: 0.2, depth: 0.1 },
    colliderHint: "box",
  },
  {
    id: "office-coffee-cup",
    label: "Coffee Cup",
    category: "clutter",
    url: "/assets/office/office-coffee-cup.glb",
    sourceName: ECLAIR_SOURCE_NAME,
    sourceUrl: ECLAIR_SOURCE_URL,
    licenseId: ECLAIR_LICENSE_ID,
    licenseUrl: ECLAIR_LICENSE_URL,
    defaultTransform: {
      position: { x: -0.4, y: 0.76, z: 0.2 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.08, height: 0.1, depth: 0.08 },
    colliderHint: "cylinder",
  },
  {
    id: "office-notebook",
    label: "Notebook",
    category: "clutter",
    url: "/assets/office/office-notebook.glb",
    sourceName: ECLAIR_SOURCE_NAME,
    sourceUrl: ECLAIR_SOURCE_URL,
    licenseId: ECLAIR_LICENSE_ID,
    licenseUrl: ECLAIR_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.2, y: 0.76, z: 0.25 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.2, height: 0.01, depth: 0.15 },
    colliderHint: "box",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up a manifest entry by its stable ID.
 * Returns `undefined` if the ID is not found.
 */
export function getAssetById(id: string): OfficeAssetEntry | undefined {
  return OFFICE_ASSET_MANIFEST.find((entry) => entry.id === id);
}

/**
 * Return all manifest entries belonging to a given category.
 */
export function getAssetsByCategory(category: AssetCategory): OfficeAssetEntry[] {
  return OFFICE_ASSET_MANIFEST.filter((entry) => entry.category === category);
}
