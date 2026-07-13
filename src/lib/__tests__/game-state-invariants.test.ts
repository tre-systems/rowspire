import { describe, expect, it } from 'vitest';
import { checkWin, initializeGame, makeMove } from '../game-logic';
import { GameStateSchema, WinningLineSchema } from '../schemas';
import type { Board, GameState, Player } from '../types';

function playMoves(columns: number[], random: () => number = () => 0): GameState {
  return columns.reduce(makeMove, initializeGame(random));
}

function replaceCell(board: Board, column: number, row: number, player: Player): Board {
  return board.map((cells, index) =>
    index === column ? cells.map((cell, rowIndex) => (rowIndex === row ? player : cell)) : cells,
  );
}

function expectInvalid(state: GameState, message: string) {
  const result = GameStateSchema.safeParse(state);
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues.map(issue => issue.message)).toContain(message);
}

describe('GameState aggregate invariants', () => {
  it('represents every possible horizontal winning-line length', () => {
    for (let length = 4; length <= 7; length++) {
      const board = initializeGame(() => 0).board.map((column, index) =>
        index < length ? column.map((cell, row) => (row === 5 ? 'player1' : cell)) : column,
      );
      const line = checkWin(board, length - 1, 5, 'player1');

      expect(line?.positions).toHaveLength(length);
      expect(WinningLineSchema.safeParse(line).success).toBe(true);
    }
  });

  it('accepts a five-position winning line created by the final move', () => {
    const game = playMoves([0, 6, 1, 6, 3, 5, 4, 5, 2]);

    expect(game.winningLine?.positions).toHaveLength(5);
    expect(GameStateSchema.safeParse(game).success).toBe(true);
  });

  it('makes the starting player deterministic through an injected random source', () => {
    expect(initializeGame(() => 0).currentPlayer).toBe('player1');
    expect(initializeGame(() => 0.5).currentPlayer).toBe('player2');
  });

  it('rejects a board that does not match its history', () => {
    const game = initializeGame(() => 0);
    const board = replaceCell(game.board, 0, 5, 'player1');

    expectInvalid({ ...game, board }, 'Board does not match move history');
  });

  it('rejects move history that violates gravity', () => {
    const game = initializeGame(() => 0);
    const history = [{ player: 'player1' as const, column: 0, row: 4 }];

    expectInvalid({ ...game, history }, 'Move history violates board gravity');
  });

  it('rejects move history that does not alternate players', () => {
    const game = playMoves([0, 1]);
    const history = game.history.map(move => ({ ...move, player: 'player1' as const }));

    expectInvalid({ ...game, history }, 'Move history must alternate players');
  });

  it('rejects an incorrect current player', () => {
    const game = playMoves([0]);

    expectInvalid(
      { ...game, currentPlayer: 'player1' },
      'Current player must follow the last player',
    );
  });

  it('rejects a winning line that does not describe the board', () => {
    const game = playMoves([0, 6, 1, 6, 2, 5, 3]);
    const winningLine = game.winningLine && {
      ...game.winningLine,
      positions: game.winningLine.positions.map(position => ({ ...position, row: 4 })),
    };

    expectInvalid({ ...game, winningLine }, 'Winning line is invalid');
  });

  it('rejects a winner other than the last player', () => {
    const game = playMoves([0, 6, 1, 6, 2, 5, 3]);

    expectInvalid({ ...game, winner: 'player2' }, 'Only the last player can win');
  });

  it('rejects a draw result before the board is full', () => {
    const game = playMoves([0]);
    const finished = {
      ...game,
      gameStatus: 'finished' as const,
      currentPlayer: 'player1' as const,
    };

    expectInvalid(finished, 'A finished game without a winner must be a draw');
  });

  it('rejects a terminal board marked as playing', () => {
    const game = playMoves([0, 6, 1, 6, 2, 5, 3]);
    const playing = { ...game, gameStatus: 'playing' as const, winner: null, winningLine: null };

    expectInvalid(playing, 'A playing game has already finished');
  });

  it('rejects history that continues after a win', () => {
    const won = playMoves([0, 6, 1, 6, 2, 5, 3]);
    const history = [...won.history, { player: 'player2' as const, column: 4, row: 5 }];

    expectInvalid({ ...won, history }, 'Move history continues after the game finished');
  });

  it('accepts every reachable state in deterministic generated games', () => {
    for (const random of [() => 0, () => 1]) {
      let game = initializeGame(random);

      for (let turn = 0; turn < 42 && game.gameStatus === 'playing'; turn++) {
        const validColumns = game.board.flatMap((column, index) =>
          column.includes(null) ? [index] : [],
        );
        const column = validColumns[(turn * 11 + 3) % validColumns.length];
        if (column === undefined) break;

        game = makeMove(game, column);
        expect(GameStateSchema.safeParse(game).success).toBe(true);
      }
    }
  });
});
