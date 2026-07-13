import type { Draft } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { initializeGame, makeMove } from './game-logic';
import { isCurrentPendingMove, isHumanTurn } from './game-state-machine';
import { createAIActions } from './game-store-ai-actions';
import { emptyGameState, parsePersistedState, type GameStore } from './game-store-state';
import {
  ColumnIndexSchema,
  type AIType,
  type Difficulty,
  type GameMode,
  type GameState,
} from './types';
import type { UsageEvent } from './usage';

export type GameStoreDependencies = {
  ai: {
    initialize: () => Promise<void>;
    chooseMove: (
      state: GameState,
      type: AIType,
      difficulty: Difficulty,
      random: () => number,
    ) => Promise<number>;
  };
  wait: (duration: number) => Promise<void>;
  random: () => number;
  reportError: (message: string) => void;
  reportUsage: (event: UsageEvent) => void;
};

export type StoreAccess = {
  set: (update: (state: Draft<GameStore>) => void) => void;
  get: () => GameStore;
};

export type GameGeneration = { value: number };

type LifecycleActions = Pick<
  GameStore['actions'],
  'initialize' | 'startGame' | 'reset' | 'showWinnerModal'
>;

function createLifecycleActions(
  { set }: StoreAccess,
  dependencies: GameStoreDependencies,
  generation: GameGeneration,
): LifecycleActions {
  const invalidate = () => {
    generation.value += 1;
  };

  return {
    initialize: () => {
      void dependencies.ai.initialize().catch(error => {
        console.warn('Failed to initialize WASM AI:', error);
      });
    },
    startGame: () => {
      invalidate();
      set(state => {
        state.gameState = initializeGame(dependencies.random);
        state.aiThinking = false;
        state.pendingMove = null;
        state.showWinnerModal = false;
      });
      dependencies.reportUsage('game_started');
    },
    reset: () => {
      invalidate();
      set(state => {
        state.gameState = emptyGameState();
        state.aiThinking = false;
        state.pendingMove = null;
        state.showWinnerModal = false;
      });
    },
    showWinnerModal: () => {
      set(state => {
        state.showWinnerModal = state.gameState.gameStatus === 'finished';
      });
    },
  };
}

type MoveActions = Pick<GameStore['actions'], 'makeMove' | 'completeMove'>;

function createMoveActions(
  { set, get }: StoreAccess,
  dependencies: GameStoreDependencies,
): MoveActions {
  return {
    makeMove: column => {
      const parsedColumn = ColumnIndexSchema.safeParse(column);
      const state = get();
      if (!parsedColumn.success || state.aiThinking || state.pendingMove) return;
      if (!isHumanTurn(state.gameState, state.gameMode)) return;
      if (!state.gameState.board[parsedColumn.data]?.includes(null)) return;

      set(store => {
        store.pendingMove = {
          column: parsedColumn.data,
          player: state.gameState.currentPlayer,
          source: 'human',
        };
      });
    },
    completeMove: () => {
      const { gameState, pendingMove } = get();
      if (!pendingMove) return;

      if (!isCurrentPendingMove(gameState, pendingMove)) {
        set(state => {
          state.pendingMove = null;
        });
        return;
      }

      const nextGameState = makeMove(gameState, pendingMove.column);
      set(state => {
        state.gameState = nextGameState;
        state.pendingMove = null;
        state.showWinnerModal = nextGameState.gameStatus === 'finished' && !nextGameState.winner;
      });
      if (nextGameState.gameStatus === 'finished') {
        dependencies.reportUsage('game_completed');
      }
    },
  };
}

type SettingsActions = Pick<
  GameStore['actions'],
  'setAI' | 'setPlayer1AI' | 'setPlayer2AI' | 'setDifficulty' | 'setGameMode'
>;

function createSettingsActions(set: StoreAccess['set']): SettingsActions {
  const setPlayerAI = (player: 'player1AI' | 'player2AI', aiType: AIType) => {
    set(state => {
      state[player] = aiType;
    });
  };
  const setGameMode = (gameMode: GameMode) => {
    set(state => {
      state.gameMode = gameMode;
    });
  };

  return {
    setAI: aiType => {
      set(state => {
        state.selectedAI = aiType;
        state.player2AI = aiType;
      });
    },
    setPlayer1AI: aiType => setPlayerAI('player1AI', aiType),
    setPlayer2AI: aiType => setPlayerAI('player2AI', aiType),
    setDifficulty: difficulty => {
      set(state => {
        state.difficulty = difficulty;
      });
    },
    setGameMode,
  };
}

export function createGameStoreState(dependencies: GameStoreDependencies) {
  return immer<GameStore>((set, get) => {
    const access: StoreAccess = { set, get };
    const generation = { value: 0 };

    return {
      ...parsePersistedState(undefined),
      aiThinking: false,
      pendingMove: null,
      showWinnerModal: false,
      actions: {
        ...createLifecycleActions(access, dependencies, generation),
        ...createMoveActions(access, dependencies),
        ...createAIActions(access, dependencies, generation),
        ...createSettingsActions(set),
      },
    };
  });
}
