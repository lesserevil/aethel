// SceneEnvironment — procedural primitive environment geometry + lighting
// Renders a floor plane, four boundary walls, and scene lighting.
// No external assets, GLTF, or art pipeline dependencies.
//
// Lighting and colors are driven by EnvironmentState (timeOfDay, lighting, preset).

// Side-effect import: activates the global JSX.IntrinsicElements augmentation
// from @react-three/fiber so TypeScript recognises <mesh>, <group>, etc.
import "@react-three/fiber";
import type { EnvironmentState } from "../../../state/sessionTypes";

// ── Lighting configuration derived from session state ─────────────────────

/**
 * Map timeOfDay + lighting preset → light parameters.
 * Returns plain serializable values — no Three.js objects escape this module.
 */
export function deriveSceneLighting(environment: EnvironmentState): {
  ambientColor: string;
  ambientIntensity: number;
  keyColor: string;
  keyIntensity: number;
  fillColor: string;
  fillIntensity: number;
  floorColor: string;
  wallColor: string;
} {
  // Time-of-day palette
  const timeOfDay = environment.timeOfDay ?? "day";
  const lighting = environment.lighting ?? "bright";

  // Base colors by time of day
  const timeColors: Record<string, { ambient: string; key: string; fill: string }> = {
    morning: { ambient: "#ffe0b2", key: "#ffd180", fill: "#80d8ff" },
    day: { ambient: "#d0d8ff", key: "#ffffff", fill: "#8090ff" },
    evening: { ambient: "#ff8a65", key: "#ffb74d", fill: "#5c6bc0" },
    night: { ambient: "#1a237e", key: "#3949ab", fill: "#1565c0" },
  };

  const palette = timeColors[timeOfDay] ?? timeColors.day;

  // Base intensity by lighting preset
  const lightingMultiplier: Record<string, number> = {
    bright: 1.4,
    natural: 1.0,
    dim: 0.45,
    dramatic: 1.0, // handled via high key / low fill contrast
  };
  const multiplier = lightingMultiplier[lighting] ?? 1.0;

  const ambientIntensity = (timeOfDay === "night" ? 0.15 : 0.4) * multiplier;
  const keyIntensity = (lighting === "dramatic" ? 2.0 : 1.2) * multiplier;
  const fillIntensity = (lighting === "dramatic" ? 0.1 : 0.4) * multiplier;

  // Floor and wall colors vary by preset + time
  const presetFloorColors: Record<string, string> = {
    laboratory: "#1a1a2e",
    office: "#2a2a3a",
    outdoor: "#1e3a1e",
    studio: "#22222e",
  };
  const presetWallColors: Record<string, string> = {
    laboratory: "#16213e",
    office: "#1c2030",
    outdoor: "#0d2b0d",
    studio: "#1a1a26",
  };

  const preset = environment.preset ?? "laboratory";
  const floorColor =
    timeOfDay === "night"
      ? "#0a0a14"
      : (presetFloorColors[preset] ?? presetFloorColors.laboratory);
  const wallColor =
    timeOfDay === "night"
      ? "#080c1a"
      : (presetWallColors[preset] ?? presetWallColors.laboratory);

  return {
    ambientColor: palette.ambient,
    ambientIntensity,
    keyColor: palette.key,
    keyIntensity,
    fillColor: palette.fill,
    fillIntensity,
    floorColor,
    wallColor,
  };
}

// ── Component ─────────────────────────────────────────────────────────────

interface SceneEnvironmentProps {
  /** Session environment state — drives all lighting and color choices */
  environment: EnvironmentState;
  /** Size of the arena in world units (default 20) */
  size?: number;
  /** Wall height in world units (default 4) */
  wallHeight?: number;
}

export function SceneEnvironment({
  environment,
  size = 20,
  wallHeight = 4,
}: SceneEnvironmentProps) {
  const half = size / 2;
  const wallThickness = 0.3;

  const {
    ambientColor,
    ambientIntensity,
    keyColor,
    keyIntensity,
    fillColor,
    fillIntensity,
    floorColor,
    wallColor,
  } = deriveSceneLighting(environment);

  return (
    // NOTE: Three.js/R3F scene objects (group, mesh, lights) do NOT support
    // HTML data-* attributes. Removing data-testid from JSX Three.js primitives
    // to avoid R3F crashes when it tries to apply the props to Three.js objects.
    <group>
      {/* Ambient light — base scene illumination */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Key light — directional from upper-front */}
      <directionalLight
        position={[5, 10, 7]}
        intensity={keyIntensity}
        color={keyColor}
        castShadow
      />

      {/* Fill light — soft from opposite side */}
      <directionalLight
        position={[-4, 6, -5]}
        intensity={fillIntensity}
        color={fillColor}
      />

      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* North wall */}
      <mesh position={[0, wallHeight / 2 - 0.5, -half]} receiveShadow>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* South wall */}
      <mesh position={[0, wallHeight / 2 - 0.5, half]} receiveShadow>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* West wall */}
      <mesh position={[-half, wallHeight / 2 - 0.5, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* East wall */}
      <mesh position={[half, wallHeight / 2 - 0.5, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}
