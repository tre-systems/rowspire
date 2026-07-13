import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import fixtureData from '../../../resources/conformance/game-rules.json';
import { BOARD_COLUMNS, BOARD_ROWS } from '../constants';
import { initializeGame, makeMove } from '../game-logic';
import { getValidMoves } from '../logic/board-logic';
import { PlayerSchema, type Board } from '../types';

const FixtureSchema = z.object({
  schemaVersion: z.literal(1),
  cases: z.array(
    z.object({
      name: z.string(),
      moves: z.array(
        z
          .number()
          .int()
          .min(0)
          .max(BOARD_COLUMNS - 1),
      ),
      expectedBoard: z.array(z.string().length(BOARD_COLUMNS)).length(BOARD_ROWS),
      expectedCurrentPlayer: PlayerSchema,
      expectedValidMoves: z.array(
        z
          .number()
          .int()
          .min(0)
          .max(BOARD_COLUMNS - 1),
      ),
      expectedWinner: PlayerSchema.nullable(),
      expectedDraw: z.boolean(),
      expectedGameOver: z.boolean(),
    }),
  ),
});

function encodeBoard(board: Board) {
  return Array.from({ length: BOARD_ROWS }, (_, row) =>
    board
      .map(column => {
        if (column[row] === 'player1') return '1';
        if (column[row] === 'player2') return '2';
        return '.';
      })
      .join(''),
  );
}

const fixture = FixtureSchema.parse(fixtureData);

describe('shared TypeScript and Rust game rules', () => {
  it.each(fixture.cases)('$name', testCase => {
    const state = testCase.moves.reduce(
      makeMove,
      initializeGame(() => 0),
    );

    expect(encodeBoard(state.board)).toEqual(testCase.expectedBoard);
    expect(state.currentPlayer).toBe(testCase.expectedCurrentPlayer);
    expect(getValidMoves(state.board)).toEqual(testCase.expectedValidMoves);
    expect(state.winner).toBe(testCase.expectedWinner);
    expect(state.gameStatus === 'finished' && !state.winner).toBe(testCase.expectedDraw);
    expect(state.gameStatus === 'finished').toBe(testCase.expectedGameOver);
  });
});
