import type { AIType, GameMode, GameState, PendingMove } from './types';

export function isAITurn(gameState: GameState, gameMode: GameMode): boolean {
  return (
    gameState.gameStatus === 'playing' &&
    (gameMode === 'ai-vs-ai' ||
      (gameMode === 'human-vs-ai' && gameState.currentPlayer === 'player2'))
  );
}

export function isHumanTurn(gameState: GameState, gameMode: GameMode): boolean {
  return (
    gameState.gameStatus === 'playing' &&
    (gameMode === 'human-vs-human' ||
      (gameMode === 'human-vs-ai' && gameState.currentPlayer === 'player1'))
  );
}

export function isSameTurn(left: GameState, right: GameState): boolean {
  return left.currentPlayer === right.currentPlayer && left.history.length === right.history.length;
}

export function aiForTurn(
  gameState: GameState,
  gameMode: GameMode,
  selectedAI: AIType,
  player1AI: AIType,
  player2AI: AIType,
): AIType {
  if (gameMode !== 'ai-vs-ai') return selectedAI;
  return gameState.currentPlayer === 'player1' ? player1AI : player2AI;
}

export function isCurrentPendingMove(gameState: GameState, pendingMove: PendingMove): boolean {
  return gameState.gameStatus === 'playing' && gameState.currentPlayer === pendingMove.player;
}
