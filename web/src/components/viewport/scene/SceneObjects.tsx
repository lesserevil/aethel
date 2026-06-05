// SceneObjects — renders enabled scene objects.
//
// When an object has an `assetId` the renderer loads the corresponding GLB
// from the manifest via `OfficeAsset` (with Suspense + ErrorBoundary fallbacks).
// When no `assetId` is present the renderer falls back to a procedural
// primitive so tests and unrecognised object types always have visible geometry.
//
// Design constraint: No Three.js or R3F objects escape this module.
// All external state is read from `SceneObjectState` — plain serializable data.

// Side-effect import: activates the global JSX.IntrinsicElements augmentation
// from @react-three/fiber so TypeScript recognises <mesh>, <group>, etc.
import "@react-three/fiber";
import type { SceneObjectState } from "../../../state/sessionTypes";
import type { ViewEvent } from "../types";
import { getAssetById } from "../../../assets/officeAssetManifest";
import { OfficeAsset } from "./OfficeAsset";

interface SceneObjectsProps {
  objects: SceneObjectState[];
  selectedObjectId?: string;
  onViewEvent?: (event: ViewEvent) => void;
}

/** Map an object type string to a primitive geometry configuration */
function getPrimitiveProps(type: string): {
  geometry: "box" | "cylinder" | "sphere";
  dims: [number, number, number];
  color: string;
} {
  switch (type) {
    case "desk":
    case "table":
    case "workstation":
      return { geometry: "box", dims: [1.4, 0.08, 0.8], color: "#3d2b1f" };
    case "monitor":
    case "screen":
    case "display":
      return { geometry: "box", dims: [0.9, 0.55, 0.05], color: "#1a1a2e" };
    case "cabinet":
    case "storage":
    case "shelf":
      return { geometry: "box", dims: [0.7, 1.6, 0.4], color: "#2c3e50" };
    case "chair":
    case "seat":
      return { geometry: "box", dims: [0.55, 0.5, 0.55], color: "#4a4a6a" };
    case "plant":
      return { geometry: "sphere", dims: [0.3, 0.3, 0.3], color: "#2d5a27" };
    default:
      return { geometry: "sphere", dims: [0.4, 0.4, 0.4], color: "#666688" };
  }
}

/** Procedural fallback — rendered for objects without an assetId. */
function ProceduralObject({
  obj,
  isSelected,
  onViewEvent,
}: {
  obj: SceneObjectState;
  isSelected: boolean;
  onViewEvent?: (event: ViewEvent) => void;
}) {
  const { geometry, dims, color } = getPrimitiveProps(obj.type);
  const pos = obj.position ?? { x: 0, y: 0, z: 0 };
  const rot = obj.rotation ?? { x: 0, y: 0, z: 0 };
  const scl = obj.scale ?? { x: 1, y: 1, z: 1 };

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const handleClick = () => {
    onViewEvent?.({
      type: "object-click",
      objectId: obj.id,
      position: { x: pos.x, y: pos.y, z: pos.z },
    });
  };

  const handlePointerOver = () => {
    onViewEvent?.({ type: "object-hover", objectId: obj.id });
  };

  const handlePointerOut = () => {
    onViewEvent?.({ type: "object-blur", objectId: obj.id });
  };

  return (
    // NOTE: Three.js/R3F primitives do not support data-* HTML attributes.
    // Using userData for scene object metadata instead of data-testid.
    <mesh
      position={[pos.x, pos.y, pos.z]}
      rotation={[toRad(rot.x), toRad(rot.y), toRad(rot.z)]}
      scale={[scl.x, scl.y, scl.z]}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      userData={{ objectId: obj.id, label: obj.label, testid: `scene-object-${obj.id}` }}
    >
      {geometry === "box" && <boxGeometry args={dims} />}
      {geometry === "sphere" && <sphereGeometry args={[dims[0], 16, 16]} />}
      {geometry === "cylinder" && (
        <cylinderGeometry args={[dims[0], dims[0], dims[1], 16]} />
      )}
      <meshStandardMaterial
        color={isSelected ? "#ffffff" : color}
        roughness={0.6}
        metalness={0.2}
        emissive={isSelected ? color : "#000000"}
        emissiveIntensity={isSelected ? 0.4 : 0}
      />
    </mesh>
  );
}

/**
 * SceneObject — renders a single enabled scene object.
 *
 * Delegates to `OfficeAsset` when the object references a manifest entry via
 * `assetId`; falls back to `ProceduralObject` for objects without an assetId
 * or when the assetId does not resolve to a known manifest entry.
 *
 * Both paths receive `isSelected` and `onViewEvent` so selection highlighting
 * and click events work regardless of the rendering path.
 */
function SceneObject({
  obj,
  isSelected,
  onViewEvent,
}: {
  obj: SceneObjectState;
  isSelected: boolean;
  onViewEvent?: (event: ViewEvent) => void;
}) {
  // Resolve manifest entry — undefined if assetId is missing or unknown.
  const manifestEntry = obj.assetId ? getAssetById(obj.assetId) : undefined;

  if (manifestEntry) {
    // Build transform overrides from SceneObjectState when present.
    const pos = obj.position;
    const rot = obj.rotation;
    const scl = obj.scale;
    const DEG_TO_RAD = Math.PI / 180;

    const position: [number, number, number] | undefined = pos
      ? [pos.x, pos.y, pos.z]
      : undefined;
    const rotation: [number, number, number] | undefined = rot
      ? [rot.x * DEG_TO_RAD, rot.y * DEG_TO_RAD, rot.z * DEG_TO_RAD]
      : undefined;
    const scale: [number, number, number] | undefined = scl
      ? [scl.x, scl.y, scl.z]
      : undefined;

    return (
      <OfficeAsset
        entry={manifestEntry}
        position={position}
        rotation={rotation}
        scale={scale}
        objectId={obj.id}
        isSelected={isSelected}
        onViewEvent={onViewEvent}
      />
    );
  }

  // No assetId or unknown assetId — render a procedural primitive.
  return <ProceduralObject obj={obj} isSelected={isSelected} onViewEvent={onViewEvent} />;
}

export function SceneObjects({
  objects,
  selectedObjectId,
  onViewEvent,
}: SceneObjectsProps) {
  const enabledObjects = objects.filter((obj) => obj.enabled);

  return (
    <group>
      {enabledObjects.map((obj) => (
        <SceneObject
          key={obj.id}
          obj={obj}
          isSelected={obj.id === selectedObjectId}
          onViewEvent={onViewEvent}
        />
      ))}
    </group>
  );
}
