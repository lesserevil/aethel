import { useCallback } from "react";
import { AgentControlPanel } from "./ControlPanel";
import { ControlPanel as EnvironmentControlPanel } from "../components/controls/ControlPanel";
import { AethelViewport } from "../components/viewport";
import { ChatPanel } from "./ChatPanel";
import {
  useRendererProps,
  useSessionDispatch,
  useSessionState,
} from "../state/SessionProvider";
import {
  setSelectedObject,
  moveObject,
  appendMutation,
  appendChatMessage,
} from "../state/sessionActions";
import { createMutationRecord } from "../state/mutationLog";
import {
  isPickupObject,
  isWorkSurface,
  snapToWorkSurface,
} from "../physics/placementHelpers";
import type { ViewEvent } from "../components/viewport/types";
import type { ChatMessage } from "../state/sessionTypes";
import "./app-shell.css";

export function AppShell() {
  // Read live renderer props from session state (agent, environment, selectedObjectId)
  const rendererProps = useRendererProps();
  const state = useSessionState();
  const dispatch = useSessionDispatch();

  // Forward viewport view events to session state through the dispatch boundary.
  // The renderer must NOT mutate state directly — only emit events here.
  const handleViewEvent = useCallback(
    (event: ViewEvent) => {
      if (event.type === "object-click" && event.objectId !== undefined) {
        const clickedId = event.objectId;
        const allObjects = state.environment.objects;

        // Find the clicked object and the currently selected object
        const clickedObj = allObjects.find((o) => o.id === clickedId);
        const selectedId = state.ui.selectedObjectId;
        const selectedObj = selectedId
          ? allObjects.find((o) => o.id === selectedId)
          : undefined;

        // ── Two-step snap placement ──────────────────────────────────────────
        // If a pickup object is already selected AND the user clicks a work
        // surface, attempt to snap-place the pickup object onto the surface.
        // This is the collider-aware placement interaction.
        if (
          selectedObj &&
          clickedObj &&
          selectedObj.id !== clickedObj.id &&
          isPickupObject(selectedObj) &&
          isWorkSurface(clickedObj)
        ) {
          const result = snapToWorkSurface(selectedObj, clickedObj, allObjects);

          if (result.valid && result.snapPosition) {
            // Apply the validated snap position to session state (no direct
            // Three.js mutation — the renderer reads the updated position).
            dispatch(moveObject(selectedObj.id, result.snapPosition));

            // Record the placement interaction as a mutation
            dispatch(
              appendMutation(
                createMutationRecord({
                  source: "system",
                  target: "environment",
                  summary: `Placed "${selectedObj.label}" on "${clickedObj.label}" at (${result.snapPosition.x.toFixed(2)}, ${result.snapPosition.y.toFixed(2)}, ${result.snapPosition.z.toFixed(2)})`,
                  status: "applied",
                  payload: {
                    objectId: selectedObj.id,
                    surfaceId: clickedObj.id,
                    position: result.snapPosition,
                  },
                }),
              ),
            );

            // Append a system chat message so the agent is aware of the move
            const moveMsg: ChatMessage = {
              id: `sys-move-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: `[Scene] "${selectedObj.label}" was placed on "${clickedObj.label}".`,
              timestamp: Date.now(),
              sender: "system",
            };
            dispatch(appendChatMessage(moveMsg));

            // Deselect after a successful placement
            dispatch(setSelectedObject(undefined));
          }
          // If placement is invalid (blocked by overlap), do nothing —
          // the object stays in place and selection is preserved.
          return;
        }

        // ── Normal selection ─────────────────────────────────────────────────
        // No placement context: select the clicked object.
        dispatch(setSelectedObject(clickedId));
      } else if (event.type === "background-click") {
        // Click on empty background → deselect whatever was selected
        dispatch(setSelectedObject(undefined));
      }
      // camera-change, object-hover, object-blur are informational only for now
    },
    [dispatch, state.environment.objects, state.ui.selectedObjectId],
  );

  return (
    <div className="app-shell" role="region" aria-label="Aethel application shell">
      <aside
        className="app-shell__control-panel"
        id="control-panel"
        data-testid="control-panel-container"
      >
        <AgentControlPanel />
        <EnvironmentControlPanel />
      </aside>

      <main
        className="app-shell__viewport-panel"
        id="viewport-panel"
        role="region"
        aria-label="3D viewport"
        data-testid="viewport-panel"
      >
        <AethelViewport
          agent={rendererProps.agent}
          environment={rendererProps.environment}
          selectedObjectId={rendererProps.selectedObjectId}
          onViewEvent={handleViewEvent}
        />
      </main>

      <aside
        className="app-shell__chat-panel"
        id="chat-panel"
        role="region"
        aria-label="Chat panel"
        data-testid="chat-panel"
      >
        <ChatPanel />
      </aside>
    </div>
  );
}
