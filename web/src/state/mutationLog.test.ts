import { createMutationRecord } from "./mutationLog";

describe("MutationLog Helper", () => {
  const baseParams = {
    source: "control-panel" as const,
    target: "agent" as const,
    summary: "Test change",
    status: "applied" as const,
    payload: { test: "value" },
  };

  test("creates record with default id and timestamp", () => {
    const record = createMutationRecord(baseParams);
    expect(record).toHaveProperty("id");
    expect(record).toHaveProperty("timestamp");
    expect(record).toHaveProperty("source");
    expect(record).toHaveProperty("target");
    expect(record).toHaveProperty("summary");
    expect(record).toHaveProperty("status");
    expect(record).toHaveProperty("payload");
  });

  test("creates record with custom timestamp", () => {
    const ts = 1234567890;
    const record = createMutationRecord({ ...baseParams, timestamp: ts });
    expect(record.timestamp).toBe(ts);
  });

  test("uses custom idGenerator when provided", () => {
    const record = createMutationRecord({
      ...baseParams,
      idGenerator: () => "deterministic-id-001",
    });
    expect(record.id).toBe("deterministic-id-001");
  });

  test("idGenerator is called exactly once per record", () => {
    let callCount = 0;
    createMutationRecord({
      ...baseParams,
      idGenerator: () => {
        callCount++;
        return `id-${callCount}`;
      },
    });
    expect(callCount).toBe(1);
  });

  test("default ID starts with mr-<timestamp>- prefix", () => {
    const ts = 9999999;
    const r = createMutationRecord({ ...baseParams, timestamp: ts });
    expect(r.id).toMatch(/^mr-9999999-/);
  });

  test("with custom idGenerator and timestamp the record is fully deterministic", () => {
    const ts = 1000000000;
    const r1 = createMutationRecord({
      ...baseParams,
      timestamp: ts,
      idGenerator: () => "fixed-id",
    });
    const r2 = createMutationRecord({
      ...baseParams,
      timestamp: ts,
      idGenerator: () => "fixed-id",
    });
    expect(r1.id).toBe("fixed-id");
    expect(r2.id).toBe("fixed-id");
    expect(r1.timestamp).toBe(ts);
    expect(r2.timestamp).toBe(ts);
  });
});
