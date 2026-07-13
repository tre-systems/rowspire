import { describe, expect, it } from 'vitest';
import { checkWin, initializeGame, isDraw, makeMove } from '../game-logic';
import { emptyGameState } from '../game-store-state';
import { createEmptyBoard } from '../logic/board-logic';
import type { Board, BoardPosition, GameState, Player } from '../types';

function playMoves(columns: number[]): GameState {
  return columns.reduce(
    makeMove,
    initializeGame(() => 0),
  );
}

function boardWith(player: Player, positions: BoardPosition[]): Board {
  const board = createEmptyBoard();
  return board.map((column, columnIndex) =>
    column.map((cell, rowIndex) =>
      positions.some(({ column: x, row: y }) => x === columnIndex && y === rowIndex)
        ? player
        : cell,
    ),
  );
}

describe('game logic', () => {
  it('initializes a deterministic empty game', () => {
    const player1Game = initializeGame(() => 0);
    const player2Game = initializeGame(() => 0.5);

    expect(player1Game).toEqual({
      ...emptyGameState(),
      gameStatus: 'playing',
    });
    expect(player2Game.currentPlayer).toBe('player2');
  });

  it('places pieces with gravity and preserves the previous board', () => {
    const initial = initializeGame(() => 0);
    const first = makeMove(initial, 3);
    const second = makeMove(first, 3);

    expect(initial.board[3]?.every(cell => cell === null)).toBe(true);
    expect(first.board[3]?.[5]).toBe('player1');
    expect(second.board[3]?.[4]).toBe('player2');
    expect(first.history[0]).toEqual({ player: 'player1', column: 3, row: 5 });
    expect(first.board[0]).toBe(initial.board[0]);
  });

  it('ignores invalid, full-column, and post-game moves', () => {
    const initial = initializeGame(() => 0);
    expect(makeMove(initial, -1)).toBe(initial);
    expect(makeMove(initial, 1.5)).toBe(initial);
    expect(makeMove(initial, 7)).toBe(initial);

    const fullColumn = playMoves([0, 0, 0, 0, 0, 0]);
    expect(makeMove(fullColumn, 0)).toBe(fullColumn);

    const finished = playMoves([0, 6, 1, 6, 2, 5, 3]);
    expect(makeMove(finished, 4)).toBe(finished);
  });

  it('finishes a horizontal win with the exact winning line', () => {
    const game = playMoves([0, 6, 1, 6, 2, 5, 3]);

    expect(game.gameStatus).toBe('finished');
    expect(game.winner).toBe('player1');
    expect(game.winningLine).toEqual({
      direction: 'horizontal',
      positions: [0, 1, 2, 3].map(column => ({ column, row: 5 })),
    });
  });

  it('detects vertical and both diagonal directions', () => {
    const cases = [
      {
        positions: [
          { column: 2, row: 2 },
          { column: 2, row: 3 },
          { column: 2, row: 4 },
          { column: 2, row: 5 },
        ],
        direction: 'vertical',
      },
      {
        positions: [
          { column: 0, row: 5 },
          { column: 1, row: 4 },
          { column: 2, row: 3 },
          { column: 3, row: 2 },
        ],
        direction: 'diagonal',
      },
      {
        positions: [
          { column: 0, row: 2 },
          { column: 1, row: 3 },
          { column: 2, row: 4 },
          { column: 3, row: 5 },
        ],
        direction: 'diagonal',
      },
    ] as const;

    for (const { positions, direction } of cases) {
      const last = positions.at(-1);
      if (!last) throw new Error('Expected a winning position');
      expect(
        checkWin(boardWith('player1', [...positions]), last.column, last.row, 'player1'),
      ).toEqual({ positions, direction });
    }
  });

  it('finishes only when a full board has no winner', () => {
    const moves = [
      6, 5, 3, 0, 4, 5, 4, 6, 3, 2, 4, 4, 5, 3, 6, 1, 3, 3, 5, 4, 5, 1, 0, 6, 3, 6, 2, 4, 0, 0, 6,
      0, 2, 5, 2, 2, 1, 1, 0, 2, 1, 1,
    ];
    const game = moves.reduce(makeMove, { ...emptyGameState(), gameStatus: 'playing' as const });

    expect(game.gameStatus).toBe('finished');
    expect(game.winner).toBeNull();
    expect(isDraw(game.board)).toBe(true);
    expect(isDraw(initializeGame(() => 0).board)).toBe(false);
  });
});
