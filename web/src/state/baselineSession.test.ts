import { baselineSession, baselineSessionWithChat } from "./baselineSession";
import { SessionState } from "./sessionTypes";

describe("Baseline Session", () => {
  let session: SessionState;

  beforeEach(() => {
    session = baselineSession;
  });

  test("has a sessionId", () => {
    expect(session.sessionId).toBeDefined();
    expect(typeof session.sessionId).toBe("string");
    expect(session.sessionId.length).toBeGreaterThan(0);
  });

  test("has visible agent defaults", () => {
    expect(session.agent).toBeDefined();
    expect(session.agent.id).toBe("agent-001");
    expect(session.agent.displayName).toBe("Aethel Agent");
    expect(session.agent.personaPreset).toBe("helpful");
    expect(session.agent.tone).toBe("friendly");
    expect(session.agent.behavior.curiosity).toBe(0.7);
    expect(session.agent.behavior.formality).toBe(0.5);
    expect(session.agent.behavior.skepticism).toBe(0.3);
    expect(session.agent.appearance.avatarPreset).toBe("humanoid");
    expect(session.agent.appearance.accentColor).toBe("#4CC9F0");
    expect(session.agent.appearance.idlePose).toBe("standing");
  });

  test("has environment defaults", () => {
    expect(session.environment).toBeDefined();
    expect(session.environment.preset).toBe("laboratory");
    expect(session.environment.timeOfDay).toBe("day");
    expect(session.environment.lighting).toBe("bright");
    expect(session.environment.ambience).toBe("peaceful");
    expect(session.environment.weather).toBe("clear");
  });

  test("has at least ten scene objects covering the full MVP office set", () => {
    expect(session.environment.objects).toBeDefined();
    expect(Array.isArray(session.environment.objects)).toBe(true);
    expect(session.environment.objects.length).toBeGreaterThanOrEqual(10);
  });

  test("has stable IDs including the original three and full MVP set", () => {
    const ids = session.environment.objects.map((obj) => obj.id);
    // Original IDs preserved
    expect(ids).toContain("obj-001");
    expect(ids).toContain("obj-002");
    expect(ids).toContain("obj-003");
    // Full MVP set
    expect(ids).toContain("obj-004");
    expect(ids).toContain("obj-005");
    expect(ids).toContain("obj-006");
    expect(ids).toContain("obj-007");
    expect(ids).toContain("obj-008");
    expect(ids).toContain("obj-009");
    expect(ids).toContain("obj-010");
  });

  test("all objects have required base fields", () => {
    // Check that all objects have required fields
    session.environment.objects.forEach((obj) => {
      expect(obj.id).toBeDefined();
      expect(typeof obj.id).toBe("string");
      expect(obj.label).toBeDefined();
      expect(typeof obj.label).toBe("string");
      expect(obj.type).toBeDefined();
      expect(typeof obj.type).toBe("string");
      expect(typeof obj.enabled).toBe("boolean");
    });
  });

  test("all objects reference a manifest asset via assetId", () => {
    session.environment.objects.forEach((obj) => {
      expect(obj.assetId).toBeDefined();
      expect(typeof obj.assetId).toBe("string");
      expect((obj.assetId as string).length).toBeGreaterThan(0);
    });
  });

  test("all objects with a collider have a valid hint", () => {
    const validHints = ["box", "cylinder", "convexHull", "none"];
    session.environment.objects.forEach((obj) => {
      if (obj.collider !== undefined) {
        expect(validHints).toContain(obj.collider.hint);
      }
    });
  });

  test("has no applied mutations initially", () => {
    expect(session.mutations).toBeDefined();
    expect(Array.isArray(session.mutations)).toBe(true);
    expect(session.mutations.length).toBe(0);
  });

  test("is serializable JSON", () => {
    // This should not throw if the object is serializable
    const json = JSON.stringify(session);
    expect(json).toBeDefined();
    expect(typeof json).toBe("string");

    // Should be able to parse it back
    const parsed = JSON.parse(json);
    expect(parsed).toBeDefined();
    expect(parsed.sessionId).toBe(session.sessionId);
  });

  test("does not contain renderer-specific objects", () => {
    // Check that we don't have DOM nodes, Three.js objects, functions, etc.
    const sessionStr = JSON.stringify(session);

    // These would indicate presence of non-serializable values
    expect(sessionStr).not.toContain("Function");
    expect(sessionStr).not.toContain("Window");
    expect(sessionStr).not.toContain("Document");
    expect(sessionStr).not.toContain("WebGLRenderingContext");
  });

  test("baselineSessionWithChat has seeded chat history", () => {
    const sessionWithChat = baselineSessionWithChat;
    expect(sessionWithChat.chat.messages.length).toBeGreaterThan(0);
    expect(sessionWithChat.chat.messages[0].content).toContain("Hello!");
    expect(sessionWithChat.chat.messages[1].content).toContain("Hi there!");
  });
});
