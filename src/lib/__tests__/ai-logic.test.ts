import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeAIMove as chooseAIMove } from '../logic/ai-logic';
import { createEmptyBoard } from '../logic/board-logic';
import type { Board, GameState } from '../types';
import type WASMAIService from '../wasm-ai-service';
import { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';

const base: Omit<GameState, 'board'> = {
  currentPlayer: 'player1',
  gameStatus: 'playing',
  winner: null,
  history: [],
  winningLine: null,
};

const gameState = (): GameState => ({ ...base, board: createEmptyBoard() });

const bestMoveResponse = (move: number | null) => ({
  move,
  evaluations: [],
  nodesEvaluated: 10,
  transpositionHits: 2,
});

const service = {
  isReady: true,
  getBestMove: vi.fn(),
  getMLMove: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  service.getBestMove.mockReset();
  service.getMLMove.mockReset();
  vi.mocked(initializeWASMAI).mockClear();
  service.isReady = true;
  vi.mocked(getWASMAIService).mockReturnValue(service as unknown as WASMAIService);
});

describe('makeAIMove', () => {
  it('returns a Search AI move', async () => {
    service.getBestMove.mockResolvedValue(bestMoveResponse(3));

    await expect(chooseAIMove(gameState(), 'search')).resolves.toBe(3);
  });

  it('initializes an unloaded service', async () => {
    service.isReady = false;
    service.getBestMove.mockResolvedValue(bestMoveResponse(2));

    await expect(chooseAIMove(gameState(), 'search')).resolves.toBe(2);
    expect(initializeWASMAI).toHaveBeenCalledOnce();
  });

  it('uses the ML worker when no tactical move is forced', async () => {
    service.getMLMove.mockResolvedValue({
      move: 4,
      evaluation: 0.5,
      thinking: 'Exploring',
      diagnostics: {
        validMoves: [4],
        moveEvaluations: [],
        valueNetworkOutput: 0.5,
        policyNetworkOutputs: [0, 0, 0, 0, 1, 0, 0],
      },
    });

    await expect(chooseAIMove(gameState(), 'ml')).resolves.toBe(4);
  });

  it('falls back from an invalid engine response', async () => {
    service.getBestMove
      .mockResolvedValueOnce(bestMoveResponse(null))
      .mockResolvedValueOnce(bestMoveResponse(2));

    await expect(chooseAIMove(gameState(), 'search')).resolves.toBe(2);
  });

  it('uses a valid random move when both engine attempts fail', async () => {
    service.getBestMove.mockRejectedValue(new Error('Unavailable'));
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);

    await expect(chooseAIMove(gameState(), 'search')).resolves.toBe(0);
    random.mockRestore();
  });

  it('reports failure when the board has no valid move', async () => {
    service.getBestMove.mockRejectedValue(new Error('Unavailable'));
    const board: Board = Array.from({ length: 7 }, () =>
      Array.from({ length: 6 }, () => 'player1' as const),
    );

    await expect(chooseAIMove({ ...base, board }, 'search')).rejects.toThrow(
      'AI calculation failed',
    );
  });
});
