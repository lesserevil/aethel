import { MutationRecord, MutationSource, MutationTarget, MutationStatus } from './sessionTypes';

/**
 * Creates a MutationRecord with a deterministic ID and timestamp.
 *
 * @param params - The mutation record properties.
 * @param params.source - Source of the mutation.
 * @param params.target - Target of the mutation.
 * @param params.summary - Human-readable summary.
 * @param params.status - Status of the mutation.
 * @param params.payload - Optional typed payload.
 * @param params.timestamp - Timestamp in ms; defaults to Date.now().
 * @param params.idGenerator - Function that returns a string ID; defaults to simple incremental ID.
 *
 * This helper is designed to be used in tests with mocked idGenerator
 * and timestamp to ensure deterministic output.
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
  // Default deterministic ID generation: "mr-<timestamp>-<seq>"
  const generateId = idGenerator ?? (() => `mr-${timestamp}-${Math.floor(Math.random() * 1000)}`);
  const id = generateId();

  return {
    id,
    timestamp,
    source,
    target,
    summary,
    status,
    payload,
  };
};