import { immer } from 'zustand/middleware/immer';
import { initializeGame, makeMove } from './game-logic';
import {
  aiForTurn,
  isAITurn,
  isCurrentPendingMove,
  isHumanTurn,
  isSameTurn,
} from './game-state-machine';
import { emptyGameState, parsePersistedState, type GameStore } from './game-store-state';
import { ColumnIndexSchema, type AIType, type GameState } from './types';

const AI_DELAY_MS = 500;

export type GameStoreDependencies = {
  ai: {
    initialize: () => Promise<void>;
    chooseMove: (state: GameState, type: AIType, random: () => number) => Promise<number>;
  };
  wait: (duration: number) => Promise<void>;
  random: () => number;
  reportError: (message: string) => void;
};

export function createGameStoreState(dependencies: GameStoreDependencies) {
  return immer<GameStore>((set, get) => {
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
          void dependencies.ai.initialize().catch(error => {
            console.warn('Failed to initialize WASM AI:', error);
          });
        },
        startGame: () => {
          invalidateGame();
          set(state => {
            state.gameState = initializeGame(dependencies.random);
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
            state.showWinnerModal =
              nextGameState.gameStatus === 'finished' && !nextGameState.winner;
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

          await dependencies.wait(AI_DELAY_MS);
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
            const column = await dependencies.ai.chooseMove(
              current.gameState,
              aiType,
              dependencies.random,
            );
            const latest = get();
            if (generation !== gameGeneration) return;
            if (!isSameTurn(current.gameState, latest.gameState)) return clearThinking();
            if (!isAITurn(latest.gameState, latest.gameMode)) return clearThinking();

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
            dependencies.reportError(`AI calculation failed: ${detail}.`);
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
}
