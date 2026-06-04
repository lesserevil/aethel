// AgentAvatar — procedural primitive agent avatar
// Uses simple Three.js primitives (box + sphere) to represent the agent.
// Displays a readable name label via @react-three/drei Html.
// No GLTF, art assets, or external pipelines.

import { Html } from "@react-three/drei";
import type { AgentState } from "../../../state/sessionTypes";

interface AgentAvatarProps {
  agent: AgentState;
  /** World-space position of the agent (default origin) */
  position?: [number, number, number];
  isSelected?: boolean;
}

export function AgentAvatar({
  agent,
  position = [0, 0, 0],
  isSelected = false,
}: AgentAvatarProps) {
  const accentColor = agent.appearance.accentColor;
  const bodyColor = accentColor;
  // Head is slightly lighter
  const headColor = "#ffffff";
  const [px, py, pz] = position;

  return (
    <group position={[px, py, pz]} data-testid="agent-avatar">
      {/* Body — box primitive */}
      <mesh position={[0, 0.6, 0]} castShadow data-testid="agent-body">
        <boxGeometry args={[0.5, 1.0, 0.3]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.5}
          metalness={0.3}
          emissive={isSelected ? accentColor : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Head — sphere primitive */}
      <mesh position={[0, 1.35, 0]} castShadow data-testid="agent-head">
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={headColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.35, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Name label — rendered in HTML overlay, positioned above agent head */}
      <Html
        position={[0, 1.9, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          data-testid="agent-name-label"
          style={{
            background: "rgba(0,0,0,0.65)",
            color: accentColor,
            fontFamily: "system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            border: `1px solid ${accentColor}`,
            userSelect: "none",
          }}
        >
          {agent.displayName}
        </div>
      </Html>
    </group>
  );
}
