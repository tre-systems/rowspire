import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeGame } from '../game-logic';
import type { AIWorkerClient } from '../ai-worker-client';

vi.unmock('../wasm-ai-service');

const geneticParams = {
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
};

describe('WASM AI service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses one worker client and fetches genetic parameters once', async () => {
    const client = {
      initialize: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue({
        move: 3,
        evaluations: [],
        nodesEvaluated: 1,
        transpositionHits: 0,
      }),
      ml: vi.fn().mockResolvedValue({
        move: 3,
        evaluation: 0,
        thinking: '',
        diagnostics: {
          validMoves: [3],
          moveEvaluations: [],
          valueNetworkOutput: 0,
          policyNetworkOutputs: [0, 0, 0, 1, 0, 0, 0],
        },
      }),
    };
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(geneticParams)));
    const { default: WASMAIService } = await import('../wasm-ai-service');
    const service = new WASMAIService(client as unknown as AIWorkerClient);
    const game = initializeGame();

    await service.getBestMove(game, 5);
    await service.getMLMove(game);

    expect(client.initialize).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ genetic_params: geneticParams }),
      5,
    );
    expect(client.ml).toHaveBeenCalledWith(
      expect.objectContaining({ genetic_params: geneticParams }),
    );
  });
});
