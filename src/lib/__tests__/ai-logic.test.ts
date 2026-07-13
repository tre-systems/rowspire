import { beforeEach, describe, expect, it, vi } from 'vitest';
import { immediateTacticalMove, makeAIMove as chooseAIMove } from '../logic/ai-logic';
import { createEmptyBoard } from '../logic/board-logic';
import type { Board, GameState, Player } from '../types';
import WASMAIService, { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';

function setCell(board: Board, column: number, row: number, player: Player) {
  const targetColumn = board[column];
  if (!targetColumn) throw new Error(`Invalid column ${column}`);
  targetColumn[row] = player;
}

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
  clearTranspositionTable: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  service.getBestMove.mockReset();
  service.getMLMove.mockReset();
  service.clearTranspositionTable.mockReset();
  vi.mocked(initializeWASMAI).mockClear();
  service.isReady = true;
  vi.mocked(getWASMAIService).mockReturnValue(service as unknown as WASMAIService);
});

describe('immediateTacticalMove (ML tactical safety net)', () => {
  it('takes an immediate winning move', () => {
    const board = createEmptyBoard();
    setCell(board, 0, 5, 'player1');
    setCell(board, 1, 5, 'player1');
    setCell(board, 2, 5, 'player1');
    expect(immediateTacticalMove({ ...base, board })).toBe(3);
  });

  it('blocks an immediate opponent win', () => {
    const board = createEmptyBoard();
    setCell(board, 0, 5, 'player2');
    setCell(board, 1, 5, 'player2');
    setCell(board, 2, 5, 'player2');
    expect(immediateTacticalMove({ ...base, board })).toBe(3);
  });

  it('prefers winning over blocking when both are available', () => {
    const board = createEmptyBoard();
    setCell(board, 0, 5, 'player1');
    setCell(board, 1, 5, 'player1');
    setCell(board, 2, 5, 'player1');
    setCell(board, 6, 5, 'player2');
    setCell(board, 6, 4, 'player2');
    setCell(board, 6, 3, 'player2');
    expect(immediateTacticalMove({ ...base, board })).toBe(3);
  });

  it('returns null when there is no forced move', () => {
    const board = createEmptyBoard();
    setCell(board, 3, 5, 'player1');
    expect(immediateTacticalMove({ ...base, board })).toBeNull();
  });
});

describe('makeAIMove', () => {
  it('returns a Search AI move', async () => {
    service.getBestMove.mockResolvedValue(bestMoveResponse(3));

    await expect(chooseAIMove(gameState(), 'search')).resolves.toBe(3);
    expect(service.clearTranspositionTable).toHaveBeenCalledOnce();
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
