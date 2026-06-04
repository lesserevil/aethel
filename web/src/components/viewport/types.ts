// Viewport view event types for AethelViewport
// These are pure data events — no Three.js or DOM objects escape the viewport boundary

export type ViewEventType =
  | "object-click"
  | "object-hover"
  | "object-blur"
  | "background-click"
  | "camera-change";

export interface ViewEvent {
  type: ViewEventType;
  /** ID of the scene object this event concerns (if applicable) */
  objectId?: string;
  /** World-space position approximation, plain numbers only — no Vector3 */
  position?: { x: number; y: number; z: number };
}
