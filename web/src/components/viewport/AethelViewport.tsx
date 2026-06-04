// AethelViewport — MVP center 3D viewport using React Three Fiber
//
// Renders a deterministic procedural primitive scene:
//   - Floor + 4 boundary walls (SceneEnvironment)
//   - Ambient + directional lighting driven by EnvironmentState (SceneEnvironment)
//   - At least 3 optional primitive scene objects (SceneObjects)
//   - One visible primitive agent avatar with name label (AgentAvatar)
//   - Orbit/pan/zoom camera controls (OrbitControls)
//
// Important: NO Three.js or R3F objects leak into shared session state.
// The canvas fills its container — no decorative card borders.
//
// View events (object clicks, camera changes) are emitted via onViewEvent.
// The component does NOT mutate shared session state directly.

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { AgentState, EnvironmentState } from "../../state/sessionTypes";
import type { ViewEvent } from "./types";
import { SceneEnvironment } from "./scene/SceneEnvironment";
import { AgentAvatar } from "./scene/AgentAvatar";
import { SceneObjects } from "./scene/SceneObjects";

export interface AethelViewportProps {
  agent: AgentState;
  environment: EnvironmentState;
  selectedObjectId?: string;
  onViewEvent?: (event: ViewEvent) => void;
  /** Called once when the R3F renderer is fully initialised */
  onReady?: () => void;
}

/**
 * SceneContent — all Three.js scene components rendered inside the Canvas.
 * Kept in a separate function so the Canvas children boundary is clear.
 */
function SceneContent({
  agent,
  environment,
  selectedObjectId,
  onViewEvent,
  onSceneReady,
}: {
  agent: AgentState;
  environment: EnvironmentState;
  selectedObjectId?: string;
  onViewEvent?: (event: ViewEvent) => void;
  onSceneReady: () => void;
}) {
  const readyCalledRef = useRef(false);

  // Signal ready after first render via useCallback memoised to avoid loops
  const markReady = useCallback(() => {
    if (!readyCalledRef.current) {
      readyCalledRef.current = true;
      onSceneReady();
    }
  }, [onSceneReady]);

  // We call markReady via a small invisible component that fires after mount
  return (
    <>
      <ReadySignal onReady={markReady} />

      {/* Environment drives lighting + geometry colors from EnvironmentState */}
      <SceneEnvironment environment={environment} />

      <AgentAvatar agent={agent} position={[0, 0, 0]} />

      <SceneObjects
        objects={environment.objects}
        selectedObjectId={selectedObjectId}
        onViewEvent={onViewEvent}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

/** Tiny component that fires a callback on mount (after Three.js scene is live) */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const called = useRef(false);
  if (!called.current) {
    called.current = true;
    // Schedule to next microtask so the scene has rendered once
    Promise.resolve()
      .then(onReady)
      .catch(() => {});
  }
  return null;
}

export function AethelViewport({
  agent,
  environment,
  selectedObjectId,
  onViewEvent,
  onReady,
}: AethelViewportProps) {
  const [isReady, setIsReady] = useState(false);

  const handleSceneReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  const handleBackgroundClick = useCallback(() => {
    onViewEvent?.({ type: "background-click" });
  }, [onViewEvent]);

  return (
    <div
      className="aethel-viewport"
      data-testid="aethel-viewport"
      data-viewport-ready={isReady ? "true" : "false"}
      // Expose agent appearance and environment state as HTML data attributes on
      // the wrapper div so that tests can verify state without querying Three.js
      // scene objects (Three.js/R3F primitives do not support data-* props in
      // real Chrome — they only work in the jsdom mocked environment).
      data-avatar-preset={agent.appearance.avatarPreset}
      data-idle-pose={agent.appearance.idlePose}
      data-accent-color={agent.appearance.accentColor}
      data-environment-preset={environment.preset}
      // Comma-separated IDs of enabled scene objects for test assertions
      data-enabled-objects={environment.objects
        .filter((o) => o.enabled)
        .map((o) => o.id)
        .join(",")}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <Canvas
        camera={{
          position: [0, 8, 12],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        shadows
        gl={{ antialias: true }}
        onClick={handleBackgroundClick}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneContent
          agent={agent}
          environment={environment}
          selectedObjectId={selectedObjectId}
          onViewEvent={onViewEvent}
          onSceneReady={handleSceneReady}
        />
      </Canvas>
    </div>
  );
}
