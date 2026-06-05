// Office Asset Manifest
//
// This file is the single source of truth for every office prop used in the
// Aethel MVP scene. All entries are plain serializable metadata — no Three.js
// objects, GLTF nodes, DOM handles, or provider clients.
//
// Sources:
//   Kenney Furniture Kit — https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z
//   Aethel generated office props — https://github.com/lesserevil/aethel/tree/dev/scripts/assets
//
// License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/

import type { BodyType, ColliderType, Affordance } from "../state/sessionTypes";

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
  /** Human-readable semantic description used by agents and USD pipelines. */
  semanticLabel: string;
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
  /**
   * Physics body type for simulation.
   * Heavy/fixed props are "static"; small movable props are "dynamic".
   * Set to "kinematic" only when programmatic movement without physics forces
   * is required.
   */
  bodyType: BodyType;
  /**
   * Collision shape type for the physics/USD pipeline.
   * Prefer simple shapes (box, cylinder) over trimesh unless a test documents
   * why a complex collider is needed.
   */
  colliderType: ColliderType;
  /**
   * Object mass in kilograms. Present only on dynamic objects.
   * Omit on static or kinematic objects.
   */
  massKg?: number;
  /**
   * Coulomb friction coefficient (0 = frictionless, 1 = high friction).
   * Present only when a non-default value is needed for simulation accuracy.
   */
  friction?: number;
  /**
   * Coefficient of restitution (0 = perfectly inelastic, 1 = perfectly elastic).
   * Present only when a non-default value is needed.
   */
  restitution?: number;
  /**
   * Whether this object is safe for the agent to manipulate (pick up, move,
   * interact with) without risking environmental damage or session instability.
   * Large heavy furniture is false; small clutter and devices are true.
   */
  agentSafe: boolean;
  /** Semantic affordances describing how this object can be used. */
  affordances: Affordance[];
}

// ── Manifest entries ──────────────────────────────────────────────────────────

const KENNEY_SOURCE_NAME = "Kenney Furniture Kit";
const KENNEY_SOURCE_URL = "https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z";
const KENNEY_LICENSE_ID = "CC0-1.0";
const KENNEY_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const AETHEL_GENERATED_SOURCE_NAME = "Aethel Generated Office Props";
const AETHEL_GENERATED_SOURCE_URL =
  "https://github.com/lesserevil/aethel/tree/dev/scripts/assets";
const AETHEL_GENERATED_LICENSE_ID = "CC0-1.0";
const AETHEL_GENERATED_LICENSE_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

const defaultScale = { x: 1, y: 1, z: 1 };
const noRotation = { x: 0, y: 0, z: 0 };

export const OFFICE_ASSET_MANIFEST: OfficeAssetEntry[] = [
  {
    id: "office-desk",
    label: "Office Desk",
    semanticLabel: "large office desk with a flat work surface",
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
    bodyType: "static",
    colliderType: "box",
    agentSafe: false,
    affordances: ["work-surface"],
  },
  {
    id: "office-chair",
    label: "Office Chair",
    semanticLabel: "ergonomic office chair with a padded seat",
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
    bodyType: "static",
    colliderType: "box",
    agentSafe: false,
    affordances: ["seatable"],
  },
  {
    id: "office-monitor",
    label: "Monitor",
    semanticLabel: "desktop monitor displaying a screen",
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
    bodyType: "static",
    colliderType: "box",
    agentSafe: false,
    affordances: ["displayable"],
  },
  {
    id: "office-laptop",
    label: "Laptop",
    semanticLabel: "portable laptop computer",
    category: "device",
    url: "/assets/office/office-laptop.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: -0.43, y: 0.76, z: 0.1 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.35, height: 0.22, depth: 0.32 },
    bodyType: "dynamic",
    colliderType: "box",
    massKg: 2.0,
    friction: 0.5,
    agentSafe: true,
    affordances: ["input-device", "pickup"],
  },
  {
    id: "office-keyboard",
    label: "Keyboard",
    semanticLabel: "full-size computer keyboard for text input",
    category: "device",
    url: "/assets/office/office-keyboard.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0, y: 0.76, z: 0.2 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.45, height: 0.03, depth: 0.15 },
    bodyType: "dynamic",
    colliderType: "box",
    massKg: 0.5,
    friction: 0.6,
    agentSafe: true,
    affordances: ["input-device", "pickup"],
  },
  {
    id: "office-trash-can",
    label: "Trash Can",
    semanticLabel: "cylindrical office waste bin",
    category: "container",
    url: "/assets/office/office-trash-can.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 1.05, y: 0, z: 0.55 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.3, height: 0.45, depth: 0.3 },
    bodyType: "dynamic",
    colliderType: "cylinder",
    massKg: 1.5,
    friction: 0.4,
    agentSafe: true,
    affordances: ["waste-container", "pickup"],
  },
  {
    id: "office-desk-lamp",
    label: "Desk Lamp",
    semanticLabel: "adjustable desk lamp providing directional light",
    category: "furniture",
    url: "/assets/office/office-desk-lamp.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.55, y: 0.76, z: -0.24 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.15, height: 0.5, depth: 0.15 },
    bodyType: "static",
    colliderType: "convexHull",
    agentSafe: false,
    affordances: ["light-source"],
  },
  {
    id: "office-book-stack",
    label: "Book Stack",
    semanticLabel: "small stack of books on the desk",
    category: "clutter",
    url: "/assets/office/office-book-stack.glb",
    sourceName: KENNEY_SOURCE_NAME,
    sourceUrl: KENNEY_SOURCE_URL,
    licenseId: KENNEY_LICENSE_ID,
    licenseUrl: KENNEY_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.42, y: 0.76, z: 0.02 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.15, height: 0.2, depth: 0.1 },
    bodyType: "dynamic",
    colliderType: "box",
    massKg: 0.8,
    friction: 0.5,
    agentSafe: true,
    affordances: ["pickup"],
  },
  {
    id: "office-coffee-cup",
    label: "Coffee Cup",
    semanticLabel: "ceramic coffee cup on the desk",
    category: "clutter",
    url: "/assets/office/office-coffee-cup.glb",
    sourceName: AETHEL_GENERATED_SOURCE_NAME,
    sourceUrl: AETHEL_GENERATED_SOURCE_URL,
    licenseId: AETHEL_GENERATED_LICENSE_ID,
    licenseUrl: AETHEL_GENERATED_LICENSE_URL,
    defaultTransform: {
      position: { x: -0.58, y: 0.76, z: -0.2 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.08, height: 0.1, depth: 0.08 },
    bodyType: "dynamic",
    colliderType: "cylinder",
    massKg: 0.3,
    friction: 0.4,
    restitution: 0.1,
    agentSafe: true,
    affordances: ["containable", "pickup"],
  },
  {
    id: "office-notebook",
    label: "Notebook",
    semanticLabel: "lined paper notebook for notes and sketches",
    category: "clutter",
    url: "/assets/office/office-notebook.glb",
    sourceName: AETHEL_GENERATED_SOURCE_NAME,
    sourceUrl: AETHEL_GENERATED_SOURCE_URL,
    licenseId: AETHEL_GENERATED_LICENSE_ID,
    licenseUrl: AETHEL_GENERATED_LICENSE_URL,
    defaultTransform: {
      position: { x: 0.48, y: 0.76, z: 0.2 },
      rotation: noRotation,
      scale: defaultScale,
    },
    dimensions: { width: 0.2, height: 0.03, depth: 0.15 },
    bodyType: "dynamic",
    colliderType: "box",
    massKg: 0.2,
    friction: 0.5,
    agentSafe: true,
    affordances: ["pickup"],
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
