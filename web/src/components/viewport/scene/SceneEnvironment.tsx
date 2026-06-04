// SceneEnvironment — procedural primitive environment geometry + lighting
// Renders a floor plane, four boundary walls, and scene lighting.
// No external assets, GLTF, or art pipeline dependencies.

interface SceneEnvironmentProps {
  /** Size of the arena in world units (default 20) */
  size?: number;
  /** Wall height in world units (default 4) */
  wallHeight?: number;
  /** Floor color (default dark grid-like) */
  floorColor?: string;
  /** Wall color */
  wallColor?: string;
}

export function SceneEnvironment({
  size = 20,
  wallHeight = 4,
  floorColor = "#1a1a2e",
  wallColor = "#16213e",
}: SceneEnvironmentProps) {
  const half = size / 2;
  const wallThickness = 0.3;

  return (
    <group data-testid="scene-environment">
      {/* Ambient light — base scene illumination */}
      <ambientLight intensity={0.4} color="#d0d8ff" />

      {/* Key light — directional from upper-front */}
      <directionalLight
        position={[5, 10, 7]}
        intensity={1.2}
        color="#ffffff"
        castShadow
      />

      {/* Fill light — soft from opposite side */}
      <directionalLight position={[-4, 6, -5]} intensity={0.4} color="#8090ff" />

      {/* Floor plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
        data-testid="floor"
      >
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* North wall */}
      <mesh
        position={[0, wallHeight / 2 - 0.5, -half]}
        receiveShadow
        data-testid="wall-north"
      >
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* South wall */}
      <mesh
        position={[0, wallHeight / 2 - 0.5, half]}
        receiveShadow
        data-testid="wall-south"
      >
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* West wall */}
      <mesh
        position={[-half, wallHeight / 2 - 0.5, 0]}
        receiveShadow
        data-testid="wall-west"
      >
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>

      {/* East wall */}
      <mesh
        position={[half, wallHeight / 2 - 0.5, 0]}
        receiveShadow
        data-testid="wall-east"
      >
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}
