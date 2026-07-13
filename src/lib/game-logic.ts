import type { GameState, Player, Board, MoveRecord } from './types';
import { BOARD_COLUMNS } from './constants';
import { createEmptyBoard, isDraw, checkWin } from './logic/board-logic';

export { checkWin, isDraw };

function otherPlayer(player: Player): Player {
  return player === 'player1' ? 'player2' : 'player1';
}

export function initializeGame(random: () => number = Math.random): GameState {
  const startingPlayer: Player = random() < 0.5 ? 'player1' : 'player2';
  const gameState = {
    board: createEmptyBoard(),
    currentPlayer: startingPlayer,
    gameStatus: 'playing' as const,
    winner: null,
    history: [],
    winningLine: null,
  } satisfies GameState;

  return gameState;
}

export function makeMove(gameState: GameState, column: number): GameState {
  if (gameState.gameStatus !== 'playing') return gameState;
  if (!Number.isInteger(column) || column < 0 || column >= BOARD_COLUMNS) return gameState;

  const col = gameState.board[column];
  if (!col) return gameState;

  const row = col.lastIndexOf(null);
  if (row === -1) return gameState;

  const newBoard: Board = gameState.board.map((c, i) =>
    i === column ? [...c.slice(0, row), gameState.currentPlayer, ...c.slice(row + 1)] : c,
  );

  const newHistory: MoveRecord[] = [
    ...gameState.history,
    { player: gameState.currentPlayer, column, row },
  ];

  const winResult = checkWin(newBoard, column, row, gameState.currentPlayer);
  const winner = winResult ? gameState.currentPlayer : null;
  const isDrawn = !winner && isDraw(newBoard);

  const newGameState = {
    board: newBoard,
    currentPlayer:
      winner || isDrawn ? gameState.currentPlayer : otherPlayer(gameState.currentPlayer),
    gameStatus: winner || isDrawn ? 'finished' : 'playing',
    winner,
    history: newHistory,
    winningLine: winResult,
  } satisfies GameState;

  return newGameState;
}
