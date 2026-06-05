// OfficeAsset — GLB loader boundary for manifest-backed office assets
//
// Accepts an OfficeAssetEntry (resolved from the manifest) plus optional
// transform overrides, then loads the local GLB from /assets/office/ via
// useGLTF with React Suspense.
//
// - While loading (Suspense): renders a deterministic procedural fallback box.
// - After a load failure (ErrorBoundary): renders the same fallback box.
// - After a successful load: renders the GLB scene via <primitive>.
//
// The fallback dimensions come from the manifest entry's `dimensions` field so
// the bounding volume is identical in every state and scene framing stays stable.
//
// Design constraint: the `url` prop must always come from the manifest (which
// enforces /assets/office/ paths). This component NEVER constructs or requests
// external URLs at runtime.

// Side-effect import: activates the global JSX.IntrinsicElements augmentation
// from @react-three/fiber so TypeScript recognises <mesh>, <group>, etc.
import "@react-three/fiber";
import { Suspense, Component } from "react";
import type { ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import type { OfficeAssetEntry } from "../../../assets/officeAssetManifest";

// ── Error boundary ─────────────────────────────────────────────────────────

interface AssetErrorBoundaryState {
  hasError: boolean;
}

/**
 * Class-based error boundary scoped to a single office asset.
 * Catches any Error thrown during GLB parsing or mesh construction so the
 * error never bubbles up to the parent canvas.
 */
class AssetErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  AssetErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AssetErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Fallback helpers ────────────────────────────────────────────────────────

/**
 * Map a manifest entry to a box size and a category-specific muted color.
 *
 * Pure function — testable without any rendering or Three.js context.
 * Dimensions are taken directly from entry.dimensions so the fallback box
 * occupies the same space as the real asset would.
 */
export function deriveFallbackProps(entry: OfficeAssetEntry): {
  dims: [number, number, number];
  color: string;
} {
  const categoryColors: Record<string, string> = {
    furniture: "#5c4033",
    device: "#2c3e50",
    container: "#4a5568",
    clutter: "#6b6b8a",
  };
  return {
    dims: [entry.dimensions.width, entry.dimensions.height, entry.dimensions.depth],
    color: categoryColors[entry.category] ?? "#666688",
  };
}

// ── Procedural fallback component ──────────────────────────────────────────

/**
 * Wireframe box placeholder rendered while the GLB is loading or after a
 * load error. Dimensions are derived from the manifest entry so scene
 * framing does not shift between loading and loaded states.
 */
function AssetFallback({ entry }: { entry: OfficeAssetEntry }) {
  const { dims, color } = deriveFallbackProps(entry);
  // Shift the mesh up so its base sits at Y = 0 relative to the group origin.
  const yOffset = dims[1] / 2;

  return (
    <mesh
      position={[0, yOffset, 0]}
      userData={{
        testid: `office-asset-fallback-${entry.id}`,
        assetId: entry.id,
        isFallback: true,
      }}
    >
      <boxGeometry args={dims} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} wireframe />
    </mesh>
  );
}

// ── GLB loader ─────────────────────────────────────────────────────────────

/**
 * Inner component that calls useGLTF — may suspend while loading.
 * Must be rendered inside a Suspense boundary. Separated from OfficeAsset
 * so the boundary is unambiguous.
 *
 * Clones the scene so the same asset can be mounted in multiple places
 * without sharing Three.js object state.
 */
function GLBContent({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} />;
}

// ── Public props ────────────────────────────────────────────────────────────

export interface OfficeAssetProps {
  /**
   * Full manifest entry. Resolve via getAssetById() if you only have an ID.
   * The entry's `url` must point to /assets/office/ (never an external host).
   */
  entry: OfficeAssetEntry;
  /**
   * World-space position in meters [x, y, z].
   * Defaults to the manifest's defaultTransform.position.
   */
  position?: [number, number, number];
  /**
   * Rotation in radians [x, y, z].
   * Defaults to the manifest's defaultTransform.rotation converted from degrees.
   */
  rotation?: [number, number, number];
  /**
   * Scale multiplier [x, y, z].
   * Defaults to the manifest's defaultTransform.scale.
   */
  scale?: [number, number, number];
}

// ── OfficeAsset boundary component ─────────────────────────────────────────

/**
 * Viewport boundary for a single manifest-backed GLB office asset.
 *
 * Combines a React Suspense boundary (for async loading) with a class-based
 * ErrorBoundary (for post-load parse failures) so neither state can blank or
 * crash the enclosing canvas.
 *
 * Transform props (position, rotation in radians, scale) override the
 * manifest's defaultTransform when provided; absent props fall back to the
 * manifest defaults so placement is always deterministic.
 *
 * Usage:
 *   <OfficeAsset entry={getAssetById("office-desk")!} />
 *   <OfficeAsset entry={entry} position={[1, 0, -2]} rotation={[0, Math.PI/4, 0]} />
 */
export function OfficeAsset({ entry, position, rotation, scale }: OfficeAssetProps) {
  const t = entry.defaultTransform;
  const DEG_TO_RAD = Math.PI / 180;

  const pos: [number, number, number] = position ?? [
    t.position.x,
    t.position.y,
    t.position.z,
  ];
  const rot: [number, number, number] = rotation ?? [
    t.rotation.x * DEG_TO_RAD,
    t.rotation.y * DEG_TO_RAD,
    t.rotation.z * DEG_TO_RAD,
  ];
  const scl: [number, number, number] = scale ?? [t.scale.x, t.scale.y, t.scale.z];

  const fallback = <AssetFallback entry={entry} />;

  return (
    <group
      position={pos}
      rotation={rot}
      scale={scl}
      userData={{ assetId: entry.id, testid: `office-asset-${entry.id}` }}
    >
      <AssetErrorBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <GLBContent url={entry.url} />
        </Suspense>
      </AssetErrorBoundary>
    </group>
  );
}
