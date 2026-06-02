import type { GameState, AIType, GameMode, PendingMove } from './types';

export const LATEST_VERSION = 2;

export const emptyGameState = (): GameState => ({
  board: Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => null)),
  currentPlayer: 'player1',
  gameStatus: 'not_started',
  winner: null,
  history: [],
  winningLine: null,
});

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
    initialize: (fromStorage?: boolean) => void;
    startGame: () => void;
    makeMove: (column: number) => void;
    completeMove: () => void;
    makeAIMove: () => void;
    reset: () => void;
    showWinnerModal: () => void;
    setAI: (aiType: AIType) => void;
    setPlayer1AI: (aiType: AIType) => void;
    setPlayer2AI: (aiType: AIType) => void;
    setGameMode: (mode: GameMode) => void;
  };
};
