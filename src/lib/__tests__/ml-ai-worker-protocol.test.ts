import { describe, expect, it } from 'vitest';
import {
  MLResponseSchema,
  MLWorkerRequestSchema,
  MLWorkerResponseSchema,
  workerMessageId,
} from '../ml-ai-worker-protocol';

const response = {
  move: 3,
  evaluation: 0.5,
  thinking: 'Test move',
  diagnostics: {
    validMoves: [0, 3, 6],
    moveEvaluations: [{ column: 3, score: 0.5, moveType: 'best' }],
    valueNetworkOutput: 0.5,
    policyNetworkOutputs: [0, 0, 0, 1, 0, 0, 0],
  },
};

describe('ML AI worker protocol', () => {
  it('accepts valid requests and both response variants', () => {
    expect(MLWorkerRequestSchema.safeParse({ id: 1, state: { board: [] } }).success).toBe(true);
    expect(MLWorkerResponseSchema.safeParse({ id: 1, response }).success).toBe(true);
    expect(MLWorkerResponseSchema.safeParse({ id: 1, error: 'failed' }).success).toBe(true);
    expect(MLWorkerResponseSchema.safeParse({ id: 1, response, error: 'ambiguous' }).success).toBe(
      false,
    );
  });

  it('rejects malformed engine responses', () => {
    expect(MLResponseSchema.safeParse({ ...response, move: 7 }).success).toBe(false);
    expect(
      MLResponseSchema.safeParse({
        ...response,
        diagnostics: { ...response.diagnostics, policyNetworkOutputs: [Number.NaN] },
      }).success,
    ).toBe(false);
  });

  it('extracts only valid request identifiers', () => {
    expect(workerMessageId({ id: 4, response })).toBe(4);
    expect(workerMessageId({ id: 0 })).toBeNull();
    expect(workerMessageId({ id: '4' })).toBeNull();
    expect(workerMessageId(null)).toBeNull();
  });
});
