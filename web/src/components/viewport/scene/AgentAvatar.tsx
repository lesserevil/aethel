// AgentAvatar — procedural primitive agent avatar
// Uses simple Three.js primitives to represent the agent.
// Body shape varies with avatarPreset; arm pose varies with idlePose.
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

/**
 * Derive body geometry dimensions from avatarPreset.
 * Returns plain numbers — no Three.js geometry objects escape this function.
 */
export function deriveBodyGeometry(avatarPreset: string): {
  bodyType: "box" | "sphere" | "cylinder";
  bodyDims: [number, number, number];
  headScale: number;
  metalness: number;
  roughness: number;
} {
  switch (avatarPreset) {
    case "robot":
      // More angular/mechanical: wider box body, lower metalness warmth
      return {
        bodyType: "box",
        bodyDims: [0.6, 1.0, 0.4],
        headScale: 0.28,
        metalness: 0.7,
        roughness: 0.3,
      };
    case "abstract":
      // Sphere-dominant form
      return {
        bodyType: "sphere",
        bodyDims: [0.45, 0.45, 0.45],
        headScale: 0.18,
        metalness: 0.1,
        roughness: 0.2,
      };
    case "humanoid":
    default:
      return {
        bodyType: "box",
        bodyDims: [0.5, 1.0, 0.3],
        headScale: 0.22,
        metalness: 0.3,
        roughness: 0.5,
      };
  }
}

/**
 * Derive arm positions and rotations from idlePose.
 * Returns plain numbers — no Three.js objects escape this function.
 */
export function deriveArmPose(idlePose: string): {
  leftArmPos: [number, number, number];
  rightArmPos: [number, number, number];
  leftArmRot: [number, number, number];
  rightArmRot: [number, number, number];
} {
  switch (idlePose) {
    case "waiting":
      // Arms slightly raised and bent outward
      return {
        leftArmPos: [-0.38, 0.72, 0],
        rightArmPos: [0.38, 0.72, 0],
        leftArmRot: [0, 0, -0.3],
        rightArmRot: [0, 0, 0.3],
      };
    case "thinking":
      // Right arm raised to chin height, left arm at side
      return {
        leftArmPos: [-0.35, 0.6, 0],
        rightArmPos: [0.3, 1.1, 0.15],
        leftArmRot: [0, 0, 0],
        rightArmRot: [-1.1, 0, 0.4],
      };
    case "standing":
    default:
      return {
        leftArmPos: [-0.35, 0.6, 0],
        rightArmPos: [0.35, 0.6, 0],
        leftArmRot: [0, 0, 0],
        rightArmRot: [0, 0, 0],
      };
  }
}

export function AgentAvatar({
  agent,
  position = [0, 0, 0],
  isSelected = false,
}: AgentAvatarProps) {
  const accentColor = agent.appearance.accentColor;
  const headColor = "#ffffff";
  const [px, py, pz] = position;

  const { bodyType, bodyDims, headScale, metalness, roughness } = deriveBodyGeometry(
    agent.appearance.avatarPreset,
  );

  const { leftArmPos, rightArmPos, leftArmRot, rightArmRot } = deriveArmPose(
    agent.appearance.idlePose,
  );

  // For abstract preset, body is a sphere so raise the center
  const bodyCenterY = bodyType === "sphere" ? 0.75 : 0.6;

  return (
    // NOTE: Three.js/R3F primitives do not support data-* HTML attributes.
    // Removing data-testid to prevent R3F crashes in headless browser environments.
    <group position={[px, py, pz]}>
      {/* Body — shape depends on avatarPreset */}
      {bodyType === "box" && (
        <mesh position={[0, bodyCenterY, 0]} castShadow>
          <boxGeometry args={bodyDims} />
          <meshStandardMaterial
            color={accentColor}
            roughness={roughness}
            metalness={metalness}
            emissive={isSelected ? accentColor : "#000000"}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
        </mesh>
      )}
      {bodyType === "sphere" && (
        <mesh position={[0, bodyCenterY, 0]} castShadow>
          <sphereGeometry args={[bodyDims[0], 16, 16]} />
          <meshStandardMaterial
            color={accentColor}
            roughness={roughness}
            metalness={metalness}
            emissive={isSelected ? accentColor : "#000000"}
            emissiveIntensity={isSelected ? 0.3 : 0}
          />
        </mesh>
      )}

      {/* Head — sphere primitive, scaled by preset */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[headScale, 16, 16]} />
        <meshStandardMaterial color={headColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Left arm — position/rotation driven by idlePose */}
      <mesh position={leftArmPos} rotation={leftArmRot} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Right arm — position/rotation driven by idlePose */}
      <mesh position={rightArmPos} rotation={rightArmRot} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.2]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Name label — rendered in HTML overlay, positioned above agent head.
          The data-avatar-preset and data-idle-pose attributes here are the
          HTML-accessible equivalents; the AethelViewport wrapper div also
          carries these for test convenience. */}
      <Html
        position={[0, 1.9, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          data-testid="agent-name-label"
          data-avatar-preset={agent.appearance.avatarPreset}
          data-idle-pose={agent.appearance.idlePose}
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
