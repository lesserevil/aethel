// Mutation Adapter for Control Panel Payloads
// Provides validation and normalization for mutation payloads before they reach the reducer

import { MutationRecord } from '../state/sessionTypes';

/**
 * Shape of mutation payloads coming from control panel UI
 */
export interface ControlPanelMutationPayload {
  /** Optional mutation fields that can be normalized */
  id?: string;
  timestamp?: number;
  source?: 'control-panel' | 'chat-confirmed' | 'system';
  target?: 'agent' | 'environment' | 'session' | 'chat';
  summary?: string;
  status?: 'pending' | 'applied' | 'failed';
  payload?: Record<string, unknown>;
}

/**
 * Validates and normalizes a control-panel mutation payload into a proper MutationRecord.
 *
 * @param raw - The raw payload object from the control panel
 * @returns A fully normalized MutationRecord
 * @throws Error if required fields are missing or have invalid values
 */
export function validateAndNormalizeMutation(raw: Partial<ControlPanelMutationPayload>): MutationRecord {
  // Required fields and their valid values
  const requiredFields: (keyof ControlPanelMutationPayload)[] = ['source', 'target', 'summary', 'status'];
  const allowedTargets: MutationRecord['target'][] = ['agent', 'environment', 'session', 'chat'];
  const allowedStatuses: MutationRecord['status'][] = ['pending', 'applied', 'failed'];
  const allowedSources: MutationRecord['source'][] = ['control-panel', 'chat-confirmed', 'system'];

  // Check required fields for presence and basic validity
  for (const field of requiredFields) {
    const value = raw[field];
    if (value === undefined || value === null) {
      throw new Error(`Missing required field: ${field}`);
    }
    // Additional field-specific validation
    if (field === 'summary') {
      if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Invalid summary: summary must be a non-empty string`);
      }
    }
    if (field === 'source' && typeof value !== 'string') {
      throw new Error(`Invalid source type: source must be a string`);
    }
    if (field === 'target' && typeof value !== 'string') {
      throw new Error(`Invalid target type: target must be a string`);
    }
    if (field === 'status' && typeof value !== 'string') {
      throw new Error(`Invalid status type: status must be a string`);
    }
  }

  // Validate source value
  if (!allowedSources.includes(raw.source as MutationRecord['source'])) {
    throw new Error(`Invalid source: ${(raw.source as string)}`);
  }

  // Validate target value
  if (!allowedTargets.includes(raw.target as MutationRecord['target'])) {
    throw new Error(`Invalid target: ${(raw.target as string)}`);
  }

  // Validate status value
  if (!allowedStatuses.includes(raw.status as MutationRecord['status'])) {
    throw new Error(`Invalid status: ${(raw.status as string)}`);
  }

  // Generate missing id
  if (!raw.id) {
    // Use a simple deterministic ID generation approach
    const ts = raw.timestamp ?? Date.now();
    raw.id = `mr-${ts}-${Math.floor(Math.random() * 1000)}`;
  }

  // Generate missing timestamp
  if (raw.timestamp === undefined || raw.timestamp === null) {
    raw.timestamp = Date.now();
  } else if (typeof raw.timestamp !== 'number' || isNaN(raw.timestamp)) {
    throw new Error('Timestamp must be a valid number');
  }

  // Ensure payload is an object if provided
  if (raw.payload !== undefined && raw.payload !== null && typeof raw.payload !== 'object') {
    throw new Error('Payload must be an object if provided');
  }

  // Construct normalized MutationRecord
  const normalized: MutationRecord = {
    id: raw.id as string,
    timestamp: raw.timestamp as number,
    source: raw.source as MutationRecord['source'],
    target: raw.target as MutationRecord['target'],
    summary: raw.summary as string,
    status: raw.status as MutationRecord['status'],
    payload: raw.payload || {}
  };

  return normalized;
}