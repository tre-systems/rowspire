import { describe, it, expect } from 'vitest';
import { GameStateSchema, MoveRecordSchema, PendingMoveSchema } from '../schemas';
import { initializeGame, makeMove } from '../game-logic';
import { parsePersistedState } from '../game-store-state';

function playMoves(columns: number[]) {
  return columns.reduce(
    makeMove,
    initializeGame(() => 0),
  );
}

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

    it('should reject inconsistent game results', () => {
      const invalidGameState = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null)),
        currentPlayer: 'player1',
        gameStatus: 'finished',
        winner: 'player1',
        history: [],
        winningLine: null,
      };

      expect(() => GameStateSchema.parse(invalidGameState)).toThrow();
    });

    it('should reject unreachable game statuses', () => {
      const gameState = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null)),
        currentPlayer: 'player1',
        gameStatus: 'waiting',
        winner: null,
        history: [],
        winningLine: null,
      };

      expect(() => GameStateSchema.parse(gameState)).toThrow();
    });

    it('should validate finished game state', () => {
      const finishedGameState = playMoves([0, 6, 1, 6, 2, 5, 3]);

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

  describe('persisted game state', () => {
    it('retains valid legacy game data and fills missing preferences', () => {
      const gameState = {
        board: Array.from({ length: 7 }, () => Array(6).fill(null)),
        currentPlayer: 'player2',
        gameStatus: 'playing',
        winner: null,
        history: [],
        winningLine: null,
      };

      expect(parsePersistedState({ gameState })).toEqual({
        gameState,
        selectedAI: 'search',
        player1AI: 'search',
        player2AI: 'search',
        gameMode: 'human-vs-ai',
      });
    });

    it('rejects malformed persisted game data', () => {
      const state = parsePersistedState({
        gameState: { board: [] },
        gameMode: 'unsupported',
      });

      expect(state.gameState.gameStatus).toBe('not_started');
      expect(state.gameState.board).toHaveLength(7);
      expect(state.gameMode).toBe('human-vs-ai');
    });

    it('migrates an unreachable waiting state to setup', () => {
      const state = parsePersistedState({
        gameState: {
          board: Array.from({ length: 7 }, () => Array(6).fill(null)),
          currentPlayer: 'player1',
          gameStatus: 'waiting',
          winner: null,
          history: [],
          winningLine: null,
        },
      });

      expect(state.gameState.gameStatus).toBe('not_started');
    });
  });
});
