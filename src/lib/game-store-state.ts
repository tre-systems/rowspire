import {
  AITypeSchema,
  GameModeSchema,
  GameStateSchema,
  type AIType,
  type GameMode,
  type GameState,
  type PendingMove,
  type PersistedGameStore,
} from './types';
import { createEmptyBoard } from './logic/board-logic';

export const LATEST_VERSION = 4;

export const emptyGameState = (): GameState => ({
  board: createEmptyBoard(),
  currentPlayer: 'player1',
  gameStatus: 'not_started',
  winner: null,
  history: [],
  winningLine: null,
});

const defaultPersistedState = (): PersistedGameStore => ({
  gameState: emptyGameState(),
  selectedAI: 'search',
  player1AI: 'search',
  player2AI: 'search',
  gameMode: 'human-vs-ai',
});

export function parsePersistedState(value: unknown): PersistedGameStore {
  const defaults = defaultPersistedState();
  if (!value || typeof value !== 'object') return defaults;

  const state = value as Record<string, unknown>;
  return {
    gameState: GameStateSchema.safeParse(state['gameState']).data ?? defaults.gameState,
    selectedAI: AITypeSchema.safeParse(state['selectedAI']).data ?? defaults.selectedAI,
    player1AI: AITypeSchema.safeParse(state['player1AI']).data ?? defaults.player1AI,
    player2AI: AITypeSchema.safeParse(state['player2AI']).data ?? defaults.player2AI,
    gameMode: GameModeSchema.safeParse(state['gameMode']).data ?? defaults.gameMode,
  };
}

export function persistedStateFrom(store: GameStore): PersistedGameStore {
  const { gameState, selectedAI, player1AI, player2AI, gameMode } = store;
  return { gameState, selectedAI, player1AI, player2AI, gameMode };
}

export type GameStore = {
  gameState: GameState;
  aiThinking: boolean;
  pendingMove: PendingMove | null;
  showWinnerModal: boolean;
  selectedAI: AIType;
  player1AI: AIType;
  player2AI: AIType;
  gameMode: GameMode;
  actions: {
    initialize: () => void;
    startGame: () => void;
    makeMove: (column: number) => void;
    completeMove: () => void;
    makeAIMove: () => Promise<void>;
    reset: () => void;
    showWinnerModal: () => void;
    setAI: (aiType: AIType) => void;
    setPlayer1AI: (aiType: AIType) => void;
    setPlayer2AI: (aiType: AIType) => void;
    setGameMode: (mode: GameMode) => void;
  };
};
