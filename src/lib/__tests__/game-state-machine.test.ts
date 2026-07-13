import { describe, expect, it } from 'vitest';
import {
  aiForTurn,
  isAITurn,
  isCurrentPendingMove,
  isHumanTurn,
  isSameTurn,
} from '../game-state-machine';
import { emptyGameState } from '../game-store-state';

const playingGame = () => ({ ...emptyGameState(), gameStatus: 'playing' as const });

describe('Game state machine', () => {
  it('assigns turns for every game mode', () => {
    const player1Turn = playingGame();
    const player2Turn = { ...playingGame(), currentPlayer: 'player2' as const };

    expect(isHumanTurn(player1Turn, 'human-vs-ai')).toBe(true);
    expect(isAITurn(player2Turn, 'human-vs-ai')).toBe(true);
    expect(isHumanTurn(player2Turn, 'human-vs-human')).toBe(true);
    expect(isAITurn(player1Turn, 'ai-vs-ai')).toBe(true);
    expect(isHumanTurn(player1Turn, 'ai-vs-ai')).toBe(false);
  });

  it('selects the configured AI for the current player', () => {
    const player2Turn = { ...playingGame(), currentPlayer: 'player2' as const };

    expect(aiForTurn(player2Turn, 'human-vs-ai', 'ml', 'search', 'search')).toBe('ml');
    expect(aiForTurn(player2Turn, 'ai-vs-ai', 'search', 'search', 'ml')).toBe('ml');
  });

  it('recognizes current and stale work', () => {
    const game = playingGame();
    const laterGame = { ...game, history: [{ player: 'player1' as const, column: 3, row: 5 }] };

    expect(isSameTurn(game, game)).toBe(true);
    expect(isSameTurn(game, laterGame)).toBe(false);
    expect(isCurrentPendingMove(game, { player: 'player1', column: 3, source: 'human' })).toBe(
      true,
    );
    expect(isCurrentPendingMove(game, { player: 'player2', column: 3, source: 'ai' })).toBe(false);
  });
});
