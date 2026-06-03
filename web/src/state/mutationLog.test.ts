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
});
