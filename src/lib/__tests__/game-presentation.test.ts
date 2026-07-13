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
    ...overrides,
  };
}

describe('game presentation', () => {
  it('presents setup and human turns', () => {
    const setup = context({ gameState: gameState({ gameStatus: 'not_started' }) });
    expect(presentGameStatus(setup)).toMatchObject({
      text: 'Select AI and start game',
      icon: 'crown',
      tone: 'gray',
    });

    expect(presentGameStatus(context()).text).toBe("Teal's turn");
    expect(
      presentGameStatus(
        context({ gameState: gameState({ currentPlayer: 'player2' }), aiThinking: true }),
      ).text,
    ).toBe('Violet thinking...');
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
      text: 'ML AI (Violet) thinking...',
      icon: 'brain',
      tone: 'violet',
      matchup: 'Search AI vs ML AI',
    });
  });

  it('presents finished statuses', () => {
    const draw = context({ gameState: gameState({ gameStatus: 'finished' }) });
    expect(presentGameStatus(draw).text).toBe('Draw!');

    const win = context({
      gameMode: 'ai-vs-ai',
      gameState: gameState({ gameStatus: 'finished', winner: 'player1' }),
    });
    expect(presentGameStatus(win).text).toBe('Search AI (Teal) Wins!');
  });

  it('presents draws and human game results', () => {
    expect(
      presentGameCompletion(context({ gameState: gameState({ gameStatus: 'finished' }) })),
    ).toMatchObject({ title: 'Draw!', icon: null, tone: 'gray' });

    const playerWin = context({
      gameState: gameState({ gameStatus: 'finished', winner: 'player1' }),
    });
    expect(presentGameCompletion(playerWin)).toMatchObject({
      title: 'You Win!',
      icon: 'trophy',
      tone: 'green',
    });

    const aiWin = context({
      gameState: gameState({ gameStatus: 'finished', winner: 'player2' }),
    });
    expect(presentGameCompletion(aiWin)).toMatchObject({
      title: 'AI Wins!',
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
      title: 'ML AI (Violet) Wins!',
      message: '🎉 AI Battle Complete! 🎉',
      icon: 'brain',
      tone: 'violet',
      matchup: 'Search AI vs ML AI',
    });
  });
});
