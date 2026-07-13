import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../game-store';
import { emptyGameState } from '../game-store-state';
import { initializeWASMAI } from '../wasm-ai-service';
import type * as AILogic from '../logic/ai-logic';

const { calculateAIMove } = vi.hoisted(() => ({
  calculateAIMove: vi.fn<() => Promise<number>>(),
}));

vi.mock('../wasm-ai-service', () => ({
  initializeWASMAI: vi.fn().mockResolvedValue(undefined),
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
      difficulty: 'relaxed',
      gameMode: 'human-vs-ai',
    }));
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

  it('discards a pending move from a stale turn', () => {
    useGameStore.setState(state => {
      state.pendingMove = { column: 3, player: 'player2', source: 'ai' };
    });

    useGameStore.getState().actions.completeMove();

    expect(useGameStore.getState().pendingMove).toBeNull();
    expect(useGameStore.getState().gameState.history).toHaveLength(0);
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

  it('updates game preferences through typed actions', () => {
    const { actions } = useGameStore.getState();
    actions.setAI('ml');
    actions.setPlayer1AI('ml');
    actions.setPlayer2AI('search');
    actions.setDifficulty('standard');
    actions.setGameMode('ai-vs-ai');

    const state = useGameStore.getState();
    expect(state.selectedAI).toBe('ml');
    expect(state.player1AI).toBe('ml');
    expect(state.player2AI).toBe('search');
    expect(state.difficulty).toBe('standard');
    expect(state.gameMode).toBe('ai-vs-ai');
  });

  it('shows completion only for a finished game', () => {
    useGameStore.getState().actions.showWinnerModal();
    expect(useGameStore.getState().showWinnerModal).toBe(false);

    useGameStore.setState(state => {
      state.gameState.gameStatus = 'finished';
    });
    useGameStore.getState().actions.showWinnerModal();

    expect(useGameStore.getState().showWinnerModal).toBe(true);
  });
});
