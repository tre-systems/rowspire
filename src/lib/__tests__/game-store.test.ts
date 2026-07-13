import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGameStore, useGameStore, type GameStoreDependencies } from '../game-store';
import { emptyGameState } from '../game-store-state';
import { initializeWASMAI } from '../wasm-ai-service';
import type * as AILogic from '../logic/ai-logic';

const { calculateAIMove } = vi.hoisted(() => ({
  calculateAIMove: vi.fn<() => Promise<number>>(),
}));

vi.mock('../logic/ai-logic', async () => {
  const actual = await vi.importActual<typeof AILogic>('../logic/ai-logic');
  return { ...actual, makeAIMove: calculateAIMove };
});

function playingGame() {
  return { ...emptyGameState(), gameStatus: 'playing' as const };
}

describe('Game Store', () => {
  beforeEach(() => {
    calculateAIMove.mockReset().mockResolvedValue(3);
    useGameStore.setState(state => ({
      ...state,
      gameState: playingGame(),
      aiThinking: false,
      pendingMove: null,
      showWinnerModal: false,
      selectedAI: 'search',
      player1AI: 'search',
      player2AI: 'search',
      gameMode: 'human-vs-ai',
    }));
  });

  it('supports deterministic injected application ports', async () => {
    const random = vi.fn(() => 0.25);
    const chooseMove = vi.fn().mockResolvedValue(4);
    const dependencies: GameStoreDependencies = {
      ai: { initialize: vi.fn().mockResolvedValue(undefined), chooseMove },
      wait: vi.fn().mockResolvedValue(undefined),
      random,
      reportError: vi.fn(),
    };
    const store = createGameStore(dependencies);
    store.getState().actions.startGame();

    expect(random).toHaveBeenCalledOnce();
    expect(store.getState().gameState.currentPlayer).toBe('player1');

    store.setState(state => {
      state.gameState = playingGame();
      state.gameState.currentPlayer = 'player2';
    });

    await store.getState().actions.makeAIMove();

    expect(chooseMove).toHaveBeenCalledWith(expect.any(Object), 'search', random);
    expect(store.getState().pendingMove?.column).toBe(4);
  });

  it('reports AI failures through the injected error port', async () => {
    const reportError = vi.fn();
    const dependencies: GameStoreDependencies = {
      ai: {
        initialize: vi.fn().mockResolvedValue(undefined),
        chooseMove: vi.fn().mockRejectedValue(new Error('offline')),
      },
      wait: vi.fn().mockResolvedValue(undefined),
      random: Math.random,
      reportError,
    };
    const store = createGameStore(dependencies);
    store.setState(state => {
      state.gameState = playingGame();
      state.gameState.currentPlayer = 'player2';
    });

    await store.getState().actions.makeAIMove();

    expect(reportError).toHaveBeenCalledWith('AI calculation failed: offline.');
    expect(store.getState().aiThinking).toBe(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes the WASM service', () => {
    useGameStore.getState().actions.initialize();

    expect(initializeWASMAI).toHaveBeenCalled();
  });

  it('queues and completes a human move', () => {
    const { actions } = useGameStore.getState();
    actions.makeMove(3);

    expect(useGameStore.getState().pendingMove).toEqual({
      column: 3,
      player: 'player1',
      source: 'human',
    });

    actions.completeMove();

    const state = useGameStore.getState();
    expect(state.pendingMove).toBeNull();
    expect(state.gameState.board[3]?.[5]).toBe('player1');
    expect(state.gameState.currentPlayer).toBe('player2');
  });

  it('ignores invalid, occupied, and duplicate human moves', () => {
    const { actions } = useGameStore.getState();
    actions.makeMove(-1);
    expect(useGameStore.getState().pendingMove).toBeNull();

    actions.makeMove(3);
    actions.makeMove(2);
    expect(useGameStore.getState().pendingMove?.column).toBe(3);
  });

  it('does not allow a human move during an AI turn', () => {
    useGameStore.setState(state => {
      state.gameState.currentPlayer = 'player2';
    });

    useGameStore.getState().actions.makeMove(3);

    expect(useGameStore.getState().pendingMove).toBeNull();
  });

  it('deduplicates concurrent AI requests', async () => {
    vi.useFakeTimers();
    useGameStore.setState(state => {
      state.gameState.currentPlayer = 'player2';
    });

    const first = useGameStore.getState().actions.makeAIMove();
    const second = useGameStore.getState().actions.makeAIMove();
    await vi.advanceTimersByTimeAsync(500);
    await Promise.all([first, second]);

    expect(calculateAIMove).toHaveBeenCalledOnce();
    expect(useGameStore.getState().pendingMove).toEqual({
      column: 3,
      player: 'player2',
      source: 'ai',
    });
  });

  it('discards an AI result after reset', async () => {
    vi.useFakeTimers();
    let finishCalculation: ((column: number) => void) | undefined;
    calculateAIMove.mockReturnValue(
      new Promise(resolve => {
        finishCalculation = resolve;
      }),
    );
    useGameStore.setState(state => {
      state.gameState.currentPlayer = 'player2';
    });

    const request = useGameStore.getState().actions.makeAIMove();
    await vi.advanceTimersByTimeAsync(500);
    useGameStore.getState().actions.reset();
    finishCalculation?.(3);
    await request;

    const state = useGameStore.getState();
    expect(state.gameState.gameStatus).toBe('not_started');
    expect(state.pendingMove).toBeNull();
    expect(state.aiThinking).toBe(false);
  });

  it('resets all transient game state', () => {
    useGameStore.setState(state => {
      state.aiThinking = true;
      state.pendingMove = { column: 3, player: 'player1', source: 'human' };
      state.showWinnerModal = true;
    });

    useGameStore.getState().actions.reset();

    const state = useGameStore.getState();
    expect(state.gameState).toEqual(emptyGameState());
    expect(state.aiThinking).toBe(false);
    expect(state.pendingMove).toBeNull();
    expect(state.showWinnerModal).toBe(false);
  });
});
