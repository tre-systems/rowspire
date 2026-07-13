import { describe, expect, it, vi } from 'vitest';
import { createGameStore, type GameStoreDependencies } from '../game-store';
import { emptyGameState } from '../game-store-state';

vi.mock('../wasm-ai-service', () => ({
  initializeWASMAI: vi.fn().mockResolvedValue(undefined),
}));

function dependencies(
  chooseMove: GameStoreDependencies['ai']['chooseMove'],
  reportError = vi.fn(),
  random = Math.random,
  reportUsage = vi.fn(),
): GameStoreDependencies {
  return {
    ai: { initialize: vi.fn().mockResolvedValue(undefined), chooseMove },
    wait: vi.fn().mockResolvedValue(undefined),
    random,
    reportError,
    reportUsage,
  };
}

function setAITurn(store: ReturnType<typeof createGameStore>) {
  store.setState(state => {
    state.gameState = { ...emptyGameState(), gameStatus: 'playing', currentPlayer: 'player2' };
  });
}

describe('game store ports', () => {
  it('supports deterministic injected dependencies', async () => {
    const random = vi.fn(() => 0.25);
    const chooseMove = vi.fn().mockResolvedValue(4);
    const store = createGameStore(dependencies(chooseMove, vi.fn(), random));
    store.getState().actions.startGame();

    expect(random).toHaveBeenCalledOnce();
    expect(store.getState().gameState.currentPlayer).toBe('player1');

    setAITurn(store);
    await store.getState().actions.makeAIMove();

    expect(chooseMove).toHaveBeenCalledWith(expect.any(Object), 'search', random);
    expect(store.getState().pendingMove?.column).toBe(4);
  });

  it('reports game lifecycle milestones', () => {
    const reportUsage = vi.fn();
    const store = createGameStore(
      dependencies(vi.fn().mockResolvedValue(3), vi.fn(), () => 0, reportUsage),
    );

    store.getState().actions.startGame();

    const moves = [0, 6, 1, 6, 2, 5];
    for (const column of moves) {
      store.setState(state => {
        state.pendingMove = {
          column,
          player: state.gameState.currentPlayer,
          source: 'human',
        };
      });
      store.getState().actions.completeMove();
    }
    store.setState(state => {
      state.pendingMove = { column: 3, player: state.gameState.currentPlayer, source: 'human' };
    });
    store.getState().actions.completeMove();

    expect(reportUsage.mock.calls).toEqual([['game_started'], ['game_completed']]);
  });

  it.each([
    {
      name: 'a rejected calculation',
      chooseMove: vi.fn().mockRejectedValue(new Error('offline')),
      message: 'AI calculation failed: offline.',
    },
    {
      name: 'an invalid column',
      chooseMove: vi.fn().mockResolvedValue(7),
      message: 'AI calculation failed: AI returned invalid column: 7.',
    },
  ])('reports $name through the error port', async ({ chooseMove, message }) => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reportError = vi.fn();
    const store = createGameStore(dependencies(chooseMove, reportError));
    setAITurn(store);

    await store.getState().actions.makeAIMove();

    expect(reportError).toHaveBeenCalledWith(message);
    expect(store.getState().aiThinking).toBe(false);
    expect(store.getState().pendingMove).toBeNull();
  });
});
