// Unit Tests for MutationAdapter
// Covers validation, normalization, and error handling of mutation payloads

import { describe, it, expect } from 'vitest';
import { validateAndNormalizeMutation, ControlPanelMutationPayload } from '../mutationAdapter';

describe('validateAndNormalizeMutation', () => {
  it('should normalize a complete valid payload', () => {
    const raw: ControlPanelMutationPayload = {
      source: 'control-panel',
      target: 'agent',
      summary: 'Updated agent tone',
      status: 'pending',
      payload: { curiosityDelta: 0.1 }
    };
    const result = validateAndNormalizeMutation(raw);
    expect(result).toHaveProperty('id');
    expect(result.timestamp).toBeGreaterThanOrEqual(0);
    expect(result.source).toBe('control-panel');
    expect(result.target).toBe('agent');
    expect(result.summary).toBe('Updated agent tone');
    expect(result.status).toBe('pending');
    expect(result.payload).toEqual({ curiosityDelta: 0.1 });
  });

  it('should generate id and timestamp when missing', () => {
    const raw = {
      source: 'control-panel',
      target: 'environment',
      summary: 'Preset change',
      status: 'applied'
      // id and timestamp omitted
    };
    const result = validateAndNormalizeMutation(raw);
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeGreaterThanOrEqual(0);
    expect(result.id).toMatch(/^mr-\d+-\d+$/);
  });

  it('should enforce required fields presence', () => {
    const invalidPayloads = [
      { source: 'control-panel', target: 'agent', summary: '', status: 'pending' }, // empty summary
      { source: 'control-panel', target: 'agent', summary: 'Test', status: 'invalid-status' }, // invalid status
      { source: 'unknown', target: 'agent', summary: 'Test', status: 'pending' }, // invalid source
      { source: 'control-panel', target: 'unknown', summary: 'Test', status: 'pending' }, // invalid target
      { source: 'control-panel', target: 'agent', summary: 'Test' }, // missing status
      { source: 'control-panel', target: 'agent', summary: 'Test', status: 'pending', payload: 'not-an-object' } // payload not object
    ];

    for (const payload of invalidPayloads) {
      expect(() => validateAndNormalizeMutation(payload as any)).toThrowError();
    }
  });

  it('should enforce payload object if provided', () => {
    // Already covered above but keep separate for clarity
  });
});