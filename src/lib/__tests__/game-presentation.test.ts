import { describe, expect, it } from 'vitest';
import { presentGameCompletion, presentGameStatus } from '../game-presentation';
import type { GameState } from '../types';

function gameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: Array.from({ length: 7 }, () => Array(6).fill(null)),
    currentPlayer: 'player1',
    gameStatus: 'playing',
    winner: null,
    history: [],
    winningLine: null,
    ...overrides,
  };
}

function context(overrides: Partial<Parameters<typeof presentGameStatus>[0]> = {}) {
  return {
    gameState: gameState(),
    gameMode: 'human-vs-ai' as const,
    aiThinking: false,
    player1AI: 'search' as const,
    player2AI: 'ml' as const,
    difficulty: 'relaxed' as const,
    ...overrides,
  };
}

describe('game presentation', () => {
  it('presents setup and human turns', () => {
    const setup = context({ gameState: gameState({ gameStatus: 'not_started' }) });
    expect(presentGameStatus(setup)).toMatchObject({
      text: 'Choose an opponent to start',
      icon: 'crown',
      tone: 'gray',
    });

    expect(presentGameStatus(context()).text).toBe("Your turn — you're Teal");
    expect(
      presentGameStatus(
        context({ gameState: gameState({ currentPlayer: 'player2' }), aiThinking: true }),
      ).text,
    ).toBe('Your opponent is thinking…');
    expect(
      presentGameStatus(
        context({ gameState: gameState({ currentPlayer: 'player2' }), aiThinking: false }),
      ).text,
    ).toBe('Your opponent is thinking…');
  });

  it('presents AI watch mode with its matchup', () => {
    const result = presentGameStatus(
      context({
        gameState: gameState({ currentPlayer: 'player2' }),
        gameMode: 'ai-vs-ai',
        aiThinking: true,
      }),
    );

    expect(result).toEqual({
      text: 'Neural challenger (Violet) is thinking…',
      icon: 'brain',
      tone: 'violet',
      matchup: 'Relaxed · Tactician vs Neural challenger',
    });
  });

  it('presents finished statuses', () => {
    const draw = context({ gameState: gameState({ gameStatus: 'finished' }) });
    expect(presentGameStatus(draw)).toMatchObject({
      text: "It's a draw!",
      matchup: 'Relaxed · Neural challenger',
    });

    const win = context({
      gameMode: 'ai-vs-ai',
      gameState: gameState({ gameStatus: 'finished', winner: 'player1' }),
    });
    expect(presentGameStatus(win)).toMatchObject({
      text: 'Tactician wins as Teal!',
      matchup: 'Relaxed · Tactician vs Neural challenger',
    });
  });

  it('presents draws and human game results', () => {
    expect(
      presentGameCompletion(context({ gameState: gameState({ gameStatus: 'finished' }) })),
    ).toMatchObject({
      title: "It's a draw",
      icon: null,
      tone: 'gray',
      matchup: 'Relaxed · Neural challenger',
    });

    const playerWin = context({
      gameState: gameState({ gameStatus: 'finished', winner: 'player1' }),
    });
    expect(presentGameCompletion(playerWin)).toMatchObject({
      title: 'You win!',
      icon: 'trophy',
      tone: 'green',
    });

    const aiWin = context({
      gameState: gameState({ gameStatus: 'finished', winner: 'player2' }),
    });
    expect(presentGameCompletion(aiWin)).toMatchObject({
      title: 'Your opponent wins',
      icon: 'zap',
      tone: 'pink',
    });
  });

  it('presents AI watch mode results', () => {
    const result = presentGameCompletion(
      context({
        gameMode: 'ai-vs-ai',
        gameState: gameState({ gameStatus: 'finished', winner: 'player2' }),
      }),
    );

    expect(result).toEqual({
      title: 'Neural challenger wins as Violet!',
      message: 'The match is complete.',
      icon: 'brain',
      tone: 'violet',
      matchup: 'Relaxed · Tactician vs Neural challenger',
    });
  });
});
