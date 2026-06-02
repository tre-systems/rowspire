import { describe, it, expect } from 'vitest';
import { GameStateSchema, MoveRecordSchema, PendingMoveSchema } from '../schemas';

describe('Schemas', () => {
  describe('GameStateSchema', () => {
    it('should validate complete game state', () => {
      const validGameState = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null)),
        currentPlayer: 'player1' as const,
        gameStatus: 'playing' as const,
        winner: null,
        history: [],
        winningLine: null,
      };

      expect(() => GameStateSchema.parse(validGameState)).not.toThrow();
    });

    it('should reject invalid board size', () => {
      const invalidGameState = {
        board: Array.from({ length: 6 }, () => Array(6).fill(null)),
        currentPlayer: 'player1',
        gameStatus: 'playing',
        winner: null,
        history: [],
        winningLine: null,
      };

      expect(() => GameStateSchema.parse(invalidGameState)).toThrow();
    });

    it('should validate finished game state', () => {
      const finishedGameState = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null)),
        currentPlayer: 'player1' as const,
        gameStatus: 'finished' as const,
        winner: 'player1' as const,
        history: [],
        winningLine: {
          positions: [
            { column: 0, row: 5 },
            { column: 1, row: 5 },
            { column: 2, row: 5 },
            { column: 3, row: 5 },
          ],
          direction: 'horizontal' as const,
        },
      };

      expect(() => GameStateSchema.parse(finishedGameState)).not.toThrow();
    });
  });

  describe('MoveRecordSchema', () => {
    it('should validate complete move record', () => {
      const validMove = {
        player: 'player1' as const,
        column: 3,
        row: 5,
      };

      expect(() => MoveRecordSchema.parse(validMove)).not.toThrow();
    });

    it('should validate a player2 move record', () => {
      const player2Move = {
        player: 'player2' as const,
        column: 0,
        row: 4,
      };

      expect(() => MoveRecordSchema.parse(player2Move)).not.toThrow();
    });
  });

  describe('PendingMoveSchema', () => {
    it('should validate human and AI pending moves', () => {
      expect(() =>
        PendingMoveSchema.parse({ player: 'player1', column: 3, source: 'human' }),
      ).not.toThrow();

      expect(() =>
        PendingMoveSchema.parse({ player: 'player2', column: 4, source: 'ai' }),
      ).not.toThrow();
    });

    it('should reject invalid columns', () => {
      expect(() =>
        PendingMoveSchema.parse({ player: 'player1', column: 7, source: 'human' }),
      ).toThrow();
    });
  });
});
