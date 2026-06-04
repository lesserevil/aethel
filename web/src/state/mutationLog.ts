import {
  MutationRecord,
  MutationSource,
  MutationTarget,
  MutationStatus,
} from "./sessionTypes";

/**
 * Creates a MutationRecord with a consistent shape.
 *
 * Inject `idGenerator` and `timestamp` in tests for deterministic output:
 * ```ts
 * const record = createMutationRecord({
 *   source: 'control-panel', target: 'agent',
 *   summary: 'Changed display name', status: 'applied',
 *   timestamp: 1000, idGenerator: () => 'mr-test-1',
 * });
 * ```
 *
 * @param params.source      Who triggered the mutation.
 * @param params.target      Which part of session state was affected.
 * @param params.summary     Human-readable description shown in the UI.
 * @param params.status      Initial status of the record.
 * @param params.payload     Optional typed payload describing the change.
 * @param params.timestamp   Override the current timestamp (ms since epoch).
 * @param params.idGenerator Override the ID generator for deterministic tests.
 */
export const createMutationRecord = ({
  source,
  target,
  summary,
  status,
  payload,
  timestamp = Date.now(),
  idGenerator,
}: {
  source: MutationSource;
  target: MutationTarget;
  summary: string;
  status: MutationStatus;
  payload?: Record<string, unknown>;
  timestamp?: number;
  idGenerator?: () => string;
}): MutationRecord => {
  const id = idGenerator
    ? idGenerator()
    : `mr-${timestamp}-${Math.floor(Math.random() * 1_000_000)}`;

  return { id, timestamp, source, target, summary, status, payload };
};
