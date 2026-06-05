import { reducer } from "./sessionReducer";
import {
  setAgentIdentity,
  setAgentBehavior,
  setAgentAppearance,
  setAgentFull,
  setEnvironmentPreset,
  toggleObjectEnabled,
  appendChatMessage,
  updateChatMessage,
  appendMutation,
  setPendingError,
  setPendingMessageId,
  setSelectedObject,
  resetSession,
} from "./sessionActions";
import { SessionState, MutationRecord, ChatMessage } from "./sessionTypes";
import { baselineSession } from "./baselineSession";

describe("SessionReducer", () => {
  let initialState: SessionState;

  beforeEach(() => {
    // Deep-clone so each test starts with a fresh copy
    initialState = JSON.parse(JSON.stringify(baselineSession));
  });

  // ── Immutability helpers ──────────────────────────────────────────────────

  test("reducer does not mutate the input state", () => {
    const frozen = Object.freeze(JSON.parse(JSON.stringify(baselineSession)));
    // Should not throw even with a frozen object
    expect(() => reducer(frozen, setAgentIdentity({ displayName: "New" }))).not.toThrow();
    expect(frozen.agent.displayName).toBe("Aethel Agent");
  });

  // ── Agent identity ────────────────────────────────────────────────────────

  test("SET_AGENT_IDENTITY_CHANGE updates agent identity fields", () => {
    const action = setAgentIdentity({
      displayName: "Test Agent",
      personaPreset: "analytical",
    });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.displayName).toBe("Test Agent");
    expect(nextState.agent.personaPreset).toBe("analytical");
    // Sibling fields untouched
    expect(nextState.agent.behavior.curiosity).toBe(0.7);
    expect(nextState.agent.tone).toBe("friendly");
  });

  // ── Agent behavior ────────────────────────────────────────────────────────

  test("SET_AGENT_BEHAVIOR_CHANGE updates behavior values", () => {
    const action = setAgentBehavior({ curiosity: 0.9, formality: 0.2 });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.behavior.curiosity).toBe(0.9);
    expect(nextState.agent.behavior.formality).toBe(0.2);
    // Unaffected behavior field preserved
    expect(nextState.agent.behavior.skepticism).toBe(0.3);
    // Top-level agent unchanged
    expect(nextState.agent.displayName).toBe("Aethel Agent");
  });

  // ── Agent appearance ──────────────────────────────────────────────────────

  test("SET_AGENT_APPEARANCE_CHANGE updates appearance fields", () => {
    const action = setAgentAppearance({
      avatarPreset: "abstract",
      accentColor: "#FF0000",
    });
    const nextState = reducer(initialState, action);
    expect(nextState.agent.appearance.avatarPreset).toBe("abstract");
    expect(nextState.agent.appearance.accentColor).toBe("#FF0000");
    // Unaffected appearance field preserved
    expect(nextState.agent.appearance.idlePose).toBe("standing");
  });

  // ── Agent full change ─────────────────────────────────────────────────────

  test("SET_AGENT_FULL_CHANGE updates all agent fields in one dispatch (deep merge)", () => {
    const action = setAgentFull({
      displayName: "Full Change Agent",
      personaPreset: "creative",
      tone: "casual",
      behavior: { curiosity: 0.1 },
      appearance: { accentColor: "#000000" },
    });
    const nextState = reducer(initialState, action);
    // Identity fields updated
    expect(nextState.agent.displayName).toBe("Full Change Agent");
    expect(nextState.agent.personaPreset).toBe("creative");
    expect(nextState.agent.tone).toBe("casual");
    // Behavior deep-merged: only curiosity changed
    expect(nextState.agent.behavior.curiosity).toBe(0.1);
    expect(nextState.agent.behavior.formality).toBe(0.5); // unchanged
    expect(nextState.agent.behavior.skepticism).toBe(0.3); // unchanged
    // Appearance deep-merged: only accentColor changed
    expect(nextState.agent.appearance.accentColor).toBe("#000000");
    expect(nextState.agent.appearance.avatarPreset).toBe("humanoid"); // unchanged
    expect(nextState.agent.appearance.idlePose).toBe("standing"); // unchanged
    // Agent id must not change
    expect(nextState.agent.id).toBe(initialState.agent.id);
  });

  test("SET_AGENT_FULL_CHANGE with empty payload leaves agent unchanged", () => {
    const action = setAgentFull({});
    const nextState = reducer(initialState, action);
    expect(nextState.agent.displayName).toBe("Aethel Agent");
    expect(nextState.agent.behavior.curiosity).toBe(0.7);
    expect(nextState.agent.appearance.avatarPreset).toBe("humanoid");
  });

  // ── Environment preset ────────────────────────────────────────────────────

  test("SET_ENVIRONMENT_PRESET_CHANGE changes environment preset fields", () => {
    const action = setEnvironmentPreset({ preset: "outdoor", lighting: "dim" });
    const nextState = reducer(initialState, action);
    expect(nextState.environment.preset).toBe("outdoor");
    expect(nextState.environment.lighting).toBe("dim");
    // Unaffected env fields preserved
    expect(nextState.environment.timeOfDay).toBe("day");
    // Objects unchanged — baseline now includes the full MVP office prop set
    expect(nextState.environment.objects).toHaveLength(
      initialState.environment.objects.length,
    );
  });

  // ── Object toggle ─────────────────────────────────────────────────────────

  test("SET_OBJECT_TOGGLE enables/disables a specific object", () => {
    const action = toggleObjectEnabled("obj-002", false);
    const nextState = reducer(initialState, action);
    const toggled = nextState.environment.objects.find((o) => o.id === "obj-002");
    expect(toggled?.enabled).toBe(false);
    // Other objects unaffected
    const other = nextState.environment.objects.find((o) => o.id === "obj-001");
    expect(other?.enabled).toBe(true);
  });

  test("SET_OBJECT_TOGGLE re-enables a disabled object", () => {
    const disabled = reducer(initialState, toggleObjectEnabled("obj-001", false));
    const enabled = reducer(disabled, toggleObjectEnabled("obj-001", true));
    expect(enabled.environment.objects.find((o) => o.id === "obj-001")?.enabled).toBe(
      true,
    );
  });

  // ── Chat message append ───────────────────────────────────────────────────

  test("APPEND_CHAT_MESSAGE adds message to chat history", () => {
    const message: ChatMessage = {
      id: "msg-999",
      content: "Appended message",
      timestamp: 1_000,
      sender: "user",
    };
    const nextState = reducer(initialState, appendChatMessage(message));
    expect(nextState.chat.messages).toHaveLength(1);
    expect(nextState.chat.messages[0]).toEqual(message);
    // Original array not modified
    expect(initialState.chat.messages).toHaveLength(0);
  });

  test("APPEND_CHAT_MESSAGE preserves existing messages", () => {
    const m1: ChatMessage = { id: "a", content: "first", timestamp: 1, sender: "user" };
    const m2: ChatMessage = { id: "b", content: "second", timestamp: 2, sender: "agent" };
    const s1 = reducer(initialState, appendChatMessage(m1));
    const s2 = reducer(s1, appendChatMessage(m2));
    expect(s2.chat.messages).toHaveLength(2);
    expect(s2.chat.messages[0]).toEqual(m1);
    expect(s2.chat.messages[1]).toEqual(m2);
  });

  // ── Chat message update ───────────────────────────────────────────────────

  test("UPDATE_CHAT_MESSAGE updates an existing message by ID", () => {
    const message: ChatMessage = {
      id: "msg-upd",
      content: "Original",
      timestamp: 1_000,
      sender: "agent",
    };
    const withMsg = reducer(initialState, appendChatMessage(message));
    const updated = reducer(
      withMsg,
      updateChatMessage("msg-upd", { content: "Updated" }),
    );
    expect(updated.chat.messages[0].content).toBe("Updated");
    expect(updated.chat.messages[0].id).toBe("msg-upd");
  });

  test("UPDATE_CHAT_MESSAGE leaves other messages untouched", () => {
    const m1: ChatMessage = { id: "x1", content: "first", timestamp: 1, sender: "user" };
    const m2: ChatMessage = {
      id: "x2",
      content: "second",
      timestamp: 2,
      sender: "agent",
    };
    const s = reducer(
      reducer(initialState, appendChatMessage(m1)),
      appendChatMessage(m2),
    );
    const updated = reducer(s, updateChatMessage("x1", { content: "changed" }));
    expect(updated.chat.messages[0].content).toBe("changed");
    expect(updated.chat.messages[1].content).toBe("second");
  });

  // ── Mutation append ───────────────────────────────────────────────────────

  test("APPEND_MUTATION adds mutation record to mutations array", () => {
    const mutation: MutationRecord = {
      id: "mr-test-1",
      timestamp: 123_456,
      source: "control-panel",
      target: "agent",
      summary: "Test mutation",
      status: "applied",
      payload: { changedField: "value" },
    };
    const nextState = reducer(initialState, appendMutation(mutation));
    expect(nextState.mutations).toHaveLength(1);
    expect(nextState.mutations[0]).toEqual(mutation);
  });

  test("APPEND_MUTATION stacks multiple records", () => {
    const mk = (id: string): MutationRecord => ({
      id,
      timestamp: 1,
      source: "system",
      target: "environment",
      summary: id,
      status: "applied",
    });
    const s1 = reducer(initialState, appendMutation(mk("mr-1")));
    const s2 = reducer(s1, appendMutation(mk("mr-2")));
    expect(s2.mutations).toHaveLength(2);
    expect(s2.mutations.map((m) => m.id)).toEqual(["mr-1", "mr-2"]);
  });

  // ── Pending error ─────────────────────────────────────────────────────────

  test("SET_PENDING_ERROR stores error message", () => {
    const nextState = reducer(initialState, setPendingError("Network error"));
    expect(nextState.chat.error).toBe("Network error");
  });

  test("SET_PENDING_ERROR clears error when called with undefined", () => {
    const withError = reducer(initialState, setPendingError("Oops"));
    const cleared = reducer(withError, setPendingError(undefined));
    expect(cleared.chat.error).toBeUndefined();
  });

  // ── Pending message ID ────────────────────────────────────────────────────

  test("SET_PENDING_MESSAGE_ID stores a pending message ID", () => {
    const next = reducer(initialState, setPendingMessageId("msg-abc"));
    expect(next.chat.pendingMessageId).toBe("msg-abc");
  });

  test("SET_PENDING_MESSAGE_ID clears pending ID when called with undefined", () => {
    const withPending = reducer(initialState, setPendingMessageId("msg-abc"));
    const cleared = reducer(withPending, setPendingMessageId(undefined));
    expect(cleared.chat.pendingMessageId).toBeUndefined();
  });

  // ── Selected object ───────────────────────────────────────────────────────

  test("SET_SELECTED_OBJECT updates selectedObjectId", () => {
    const nextState = reducer(initialState, setSelectedObject("obj-003"));
    expect(nextState.ui.selectedObjectId).toBe("obj-003");
  });

  test("SET_SELECTED_OBJECT clears selectedObjectId when called with undefined", () => {
    const withSel = reducer(initialState, setSelectedObject("obj-001"));
    const cleared = reducer(withSel, setSelectedObject(undefined));
    expect(cleared.ui.selectedObjectId).toBeUndefined();
  });

  // ── Reset ─────────────────────────────────────────────────────────────────

  test("RESET_SESSION restores baseline while preserving chat history", () => {
    const msg: ChatMessage = {
      id: "msg-pre",
      content: "keep me",
      timestamp: 1,
      sender: "user",
    };
    const modified: SessionState = {
      ...initialState,
      agent: { ...initialState.agent, displayName: "Modified Name" },
      environment: { ...initialState.environment, preset: "outdoor" },
      ui: { ...initialState.ui, selectedObjectId: "obj-002" },
      chat: { ...initialState.chat, messages: [msg] },
      mutations: [
        {
          id: "mr-1",
          timestamp: 1,
          source: "system",
          target: "agent",
          summary: "x",
          status: "applied",
        },
      ],
    };
    const resetState = reducer(modified, resetSession());
    // Agent and environment reset to baseline
    expect(resetState.agent.displayName).toBe("Aethel Agent");
    expect(resetState.environment.preset).toBe("office");
    // Chat messages preserved
    expect(resetState.chat.messages).toHaveLength(1);
    expect(resetState.chat.messages[0]).toEqual(msg);
    // Mutations NOT preserved (baseline starts empty)
    expect(resetState.mutations).toHaveLength(0);
    // UI reset to baseline
    expect(resetState.ui.selectedObjectId).toBeUndefined();
  });

  test("RESET_SESSION preserves all accumulated chat messages", () => {
    const msgs: ChatMessage[] = [
      { id: "a", content: "1", timestamp: 1, sender: "user" },
      { id: "b", content: "2", timestamp: 2, sender: "agent" },
      { id: "c", content: "3", timestamp: 3, sender: "system" },
    ];
    let s = initialState;
    for (const m of msgs) s = reducer(s, appendChatMessage(m));
    const reset = reducer(s, resetSession());
    expect(reset.chat.messages).toHaveLength(3);
  });

  // ── Unknown actions ───────────────────────────────────────────────────────

  test("UNKNOWN action returns unchanged state", () => {
    // @ts-expect-error testing runtime unknown action
    const nextState = reducer(initialState, { type: "unknown/action", payload: {} });
    expect(nextState).toEqual(initialState);
  });

  // ── Full flow serialization ───────────────────────────────────────────────

  test("serialized state round-trips after agent + environment + chat flow", () => {
    let s = initialState;
    s = reducer(s, setAgentIdentity({ displayName: "Dr. Scope" }));
    s = reducer(s, setAgentBehavior({ curiosity: 1.0 }));
    s = reducer(s, setEnvironmentPreset({ preset: "outdoor", timeOfDay: "night" }));
    s = reducer(
      s,
      appendChatMessage({ id: "m1", content: "Hello", timestamp: 1, sender: "user" }),
    );
    s = reducer(
      s,
      appendMutation({
        id: "mr-a",
        timestamp: 1,
        source: "control-panel",
        target: "agent",
        summary: "Name change",
        status: "applied",
      }),
    );

    const json = JSON.stringify(s);
    const parsed: SessionState = JSON.parse(json);
    expect(parsed.agent.displayName).toBe("Dr. Scope");
    expect(parsed.agent.behavior.curiosity).toBe(1.0);
    expect(parsed.environment.preset).toBe("outdoor");
    expect(parsed.chat.messages[0].content).toBe("Hello");
    expect(parsed.mutations[0].id).toBe("mr-a");
  });
});
