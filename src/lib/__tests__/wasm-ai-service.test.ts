import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_GENETIC_PARAMS } from '../constants';
import { initializeGame } from '../game-logic';

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
    const service = new WASMAIService(client);
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

  it('uses validated defaults when genetic parameters are unavailable', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const client = {
      initialize: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue({
        move: 3,
        evaluations: [],
        nodesEvaluated: 1,
        transpositionHits: 0,
      }),
      ml: vi.fn(),
    };
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const { default: WASMAIService } = await import('../wasm-ai-service');

    await new WASMAIService(client).getBestMove(initializeGame(), 3);

    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ genetic_params: DEFAULT_GENETIC_PARAMS }),
      3,
    );
    expect(warning).toHaveBeenCalledOnce();
  });

  it('wraps initialization errors and permits a retry', async () => {
    const client = {
      initialize: vi
        .fn()
        .mockRejectedValueOnce(new Error('worker failed'))
        .mockResolvedValueOnce(undefined),
      search: vi.fn(),
      ml: vi.fn(),
    };
    const { default: WASMAIService } = await import('../wasm-ai-service');
    const service = new WASMAIService(client);

    await expect(service.initialize()).rejects.toThrow('Failed to load WASM AI: worker failed');
    await expect(service.initialize()).resolves.toBeUndefined();

    expect(client.initialize).toHaveBeenCalledTimes(2);
    expect(service.isReady).toBe(true);
  });
});
