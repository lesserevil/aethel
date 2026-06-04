import { createMutationRecord } from "./mutationLog";
import { MutationRecord } from "./sessionTypes";

describe("MutationLog Helper – createMutationRecord", () => {
  const baseParams = {
    source: "control-panel" as const,
    target: "agent" as const,
    summary: "Test change",
    status: "applied" as const,
    payload: { field: "value" },
  };

  // ── Required fields ──────────────────────────────────────────────────────

  test("creates a record with all required fields", () => {
    const record = createMutationRecord(baseParams);
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("timestamp");
    expect(record.source).toBe("control-panel");
    expect(record.target).toBe("agent");
    expect(record.summary).toBe("Test change");
    expect(record.status).toBe("applied");
    expect(record.payload).toEqual({ field: "value" });
  });

  test("returned record satisfies the MutationRecord interface shape", () => {
    const record: MutationRecord = createMutationRecord(baseParams);
    expect(typeof record.id).toBe("string");
    expect(typeof record.timestamp).toBe("number");
  });

  // ── Deterministic timestamp injection ────────────────────────────────────

  test("uses provided timestamp instead of Date.now()", () => {
    const ts = 1_234_567_890;
    const record = createMutationRecord({ ...baseParams, timestamp: ts });
    expect(record.timestamp).toBe(ts);
  });

  // ── Deterministic ID injection ────────────────────────────────────────────

  test("uses provided idGenerator for deterministic IDs", () => {
    let counter = 0;
    const gen = () => `mr-test-${++counter}`;
    const r1 = createMutationRecord({ ...baseParams, idGenerator: gen });
    const r2 = createMutationRecord({ ...baseParams, idGenerator: gen });
    expect(r1.id).toBe("mr-test-1");
    expect(r2.id).toBe("mr-test-2");
  });

  test("deterministic idGenerator with pinned timestamp produces identical records", () => {
    const opts = { ...baseParams, timestamp: 5_000, idGenerator: () => "mr-fixed" };
    const r1 = createMutationRecord(opts);
    const r2 = createMutationRecord(opts);
    expect(r1).toEqual(r2);
  });

  // ── Optional payload ──────────────────────────────────────────────────────

  test("omits payload key when not provided", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { payload: _p, ...noPayload } = baseParams;
    const record = createMutationRecord(noPayload);
    // payload may be undefined; the key itself may be absent depending on spread
    expect(record.payload).toBeUndefined();
  });

  // ── All source / target / status values ──────────────────────────────────

  test.each([
    ["control-panel", "agent", "pending"],
    ["chat-confirmed", "environment", "applied"],
    ["system", "session", "failed"],
    ["control-panel", "chat", "applied"],
  ] as const)(
    "creates record with source=%s target=%s status=%s",
    (source, target, status) => {
      const record = createMutationRecord({
        source,
        target,
        summary: "x",
        status,
        idGenerator: () => "test-id",
        timestamp: 1,
      });
      expect(record.source).toBe(source);
      expect(record.target).toBe(target);
      expect(record.status).toBe(status);
    },
  );
});
