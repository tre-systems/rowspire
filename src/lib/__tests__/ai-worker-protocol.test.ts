import { describe, expect, it } from 'vitest';
import {
  AIWorkerRequestSchema,
  AIWorkerResponseSchema,
  workerMessageId,
} from '../ai-worker-protocol';
import { MLResponseSchema, MLWeightsSchema } from '../wasm-ai-boundary';

const state = {
  board: Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => 'empty')),
  current_player: 'player1',
  genetic_params: {
    id: 'test',
    parent_ids: [],
    generation: 0,
    win_score: 10,
    loss_score: -10,
    center_column_value: 1,
    adjacent_center_value: 1,
    outer_column_value: 1,
    edge_column_value: 1,
    row_height_weight: 1,
    center_control_weight: 1,
    piece_count_weight: 1,
    threat_weight: 1,
    mobility_weight: 1,
    vertical_control_weight: 1,
    horizontal_control_weight: 1,
    defensive_weight: 1,
  },
};

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

describe('AI worker protocol', () => {
  it('accepts fully validated Search and ML requests', () => {
    expect(
      AIWorkerRequestSchema.safeParse({ id: 1, type: 'search', state, depth: 5 }).success,
    ).toBe(true);
    expect(AIWorkerRequestSchema.safeParse({ id: 2, type: 'ml', state }).success).toBe(true);
    expect(AIWorkerRequestSchema.safeParse({ id: 3, type: 'initialize' }).success).toBe(true);
  });

  it('rejects incomplete runtime state', () => {
    expect(
      AIWorkerRequestSchema.safeParse({ id: 1, type: 'search', state: { board: [] }, depth: 5 })
        .success,
    ).toBe(false);
  });

  it('accepts typed success and error responses', () => {
    expect(AIWorkerResponseSchema.safeParse({ id: 1, type: 'ml', response }).success).toBe(true);
    expect(AIWorkerResponseSchema.safeParse({ id: 1, error: 'failed' }).success).toBe(true);
    expect(
      AIWorkerResponseSchema.safeParse({ id: 1, type: 'ml', response, error: 'ambiguous' }).success,
    ).toBe(false);
  });

  it('requires exactly seven policy outputs', () => {
    expect(
      MLResponseSchema.safeParse({
        ...response,
        diagnostics: { ...response.diagnostics, policyNetworkOutputs: [0] },
      }).success,
    ).toBe(false);
  });

  it('validates model weights while allowing deployment metadata', () => {
    expect(
      MLWeightsSchema.safeParse({
        metadata: { phase: 3 },
        value_network: { weights: Array.from({ length: 62_593 }, () => 0.1) },
        policy_network: { weights: Array.from({ length: 63_367 }, () => 0.2) },
      }).success,
    ).toBe(true);

    expect(
      MLWeightsSchema.safeParse({
        value_network: { weights: [0.1] },
        policy_network: { weights: [0.2] },
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
