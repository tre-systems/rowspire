import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { initializeGame, makeAIMove, makeMove } from './game-logic';
import {
  aiForTurn,
  isAITurn,
  isCurrentPendingMove,
  isHumanTurn,
  isSameTurn,
} from './game-state-machine';
import {
  emptyGameState,
  LATEST_VERSION,
  parsePersistedState,
  persistedStateFrom,
  type GameStore,
} from './game-store-state';
import { ColumnIndexSchema } from './types';
import { useUIStore } from './ui-store';
import { initializeWASMAI } from './wasm-ai-service';

const AI_DELAY_MS = 500;

const delay = (duration: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, duration);
  });

const createGameStore = immer<GameStore>((set, get) => {
  let gameGeneration = 0;

  const clearThinking = () => {
    set(state => {
      state.aiThinking = false;
    });
  };

  const invalidateGame = () => {
    gameGeneration += 1;
  };

  return {
    ...parsePersistedState(undefined),
    aiThinking: false,
    pendingMove: null,
    showWinnerModal: false,
    actions: {
      initialize: () => {
        void initializeWASMAI().catch(error => {
          console.warn('Failed to initialize WASM AI:', error);
        });
      },
      startGame: () => {
        invalidateGame();
        set(state => {
          state.gameState = initializeGame();
          state.aiThinking = false;
          state.pendingMove = null;
          state.showWinnerModal = false;
        });
      },
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
      },
      makeAIMove: async () => {
        const initial = get();
        if (initial.aiThinking || initial.pendingMove) return;
        if (!isAITurn(initial.gameState, initial.gameMode)) return;

        const generation = gameGeneration;
        set(state => {
          state.aiThinking = true;
        });

        await delay(AI_DELAY_MS);
        const current = get();
        if (generation !== gameGeneration) return;
        if (!isAITurn(current.gameState, current.gameMode)) return clearThinking();

        const aiType = aiForTurn(
          current.gameState,
          current.gameMode,
          current.selectedAI,
          current.player1AI,
          current.player2AI,
        );

        try {
          const column = await makeAIMove(current.gameState, aiType);
          const latest = get();
          if (generation !== gameGeneration) return;
          if (!isSameTurn(current.gameState, latest.gameState)) {
            clearThinking();
            return;
          }
          if (!isAITurn(latest.gameState, latest.gameMode)) {
            clearThinking();
            return;
          }

          set(state => {
            state.pendingMove = {
              column,
              player: current.gameState.currentPlayer,
              source: 'ai',
            };
            state.aiThinking = false;
          });
        } catch (error) {
          if (generation !== gameGeneration) return;

          console.error('AI move calculation failed:', error);
          const detail = error instanceof Error ? error.message : 'Unknown error';
          useUIStore.getState().actions.showError(`AI calculation failed: ${detail}.`);
          clearThinking();
        }
      },
      reset: () => {
        invalidateGame();
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
      setAI: aiType => {
        set(state => {
          state.selectedAI = aiType;
          state.player2AI = aiType;
        });
      },
      setPlayer1AI: aiType => {
        set(state => {
          state.player1AI = aiType;
        });
      },
      setPlayer2AI: aiType => {
        set(state => {
          state.player2AI = aiType;
        });
      },
      setGameMode: gameMode => {
        set(state => {
          state.gameMode = gameMode;
        });
      },
    },
  };
});

export const useGameStore =
  typeof window === 'undefined'
    ? create<GameStore>()(createGameStore)
    : create<GameStore>()(
        persist(createGameStore, {
          name: 'rowspire-game-storage',
          storage: createJSONStorage(() => window.localStorage),
          version: LATEST_VERSION,
          partialize: persistedStateFrom,
          migrate: parsePersistedState,
          merge: (persistedState, currentState) => ({
            ...currentState,
            ...parsePersistedState(persistedState),
          }),
          onRehydrateStorage: () => (state, error) => {
            if (error) console.error('Failed to restore the saved game:', error);
            state?.actions.initialize();
          },
        }),
      );

export const useGameState = () => useGameStore(state => state.gameState);
export const useGameActions = () => useGameStore(state => state.actions);
