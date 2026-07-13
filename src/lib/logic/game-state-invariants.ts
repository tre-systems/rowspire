import type { Board, GameState, MoveRecord, Player, WinningLine } from '../types';
import { checkWin, createEmptyBoard, isDraw } from './board-logic';

type ReplayResult =
  | { board: Board; lastWin: WinningLine | null; error: null }
  | { board: Board; lastWin: null; error: string };

function otherPlayer(player: Player): Player {
  return player === 'player1' ? 'player2' : 'player1';
}

function addMove(board: Board, move: MoveRecord): Board {
  return board.map((column, index) =>
    index === move.column
      ? [...column.slice(0, move.row), move.player, ...column.slice(move.row + 1)]
      : column,
  );
}

function replay(history: MoveRecord[]): ReplayResult {
  let board = createEmptyBoard();
  let expectedPlayer = history[0]?.player;
  let lastWin: WinningLine | null = null;

  for (const [index, move] of history.entries()) {
    if (move.player !== expectedPlayer) {
      return { board, lastWin: null, error: 'Move history must alternate players' };
    }

    const expectedRow = board[move.column]?.lastIndexOf(null);
    if (expectedRow !== move.row) {
      return { board, lastWin: null, error: 'Move history violates board gravity' };
    }

    board = addMove(board, move);
    lastWin = checkWin(board, move.column, move.row, move.player);

    if ((lastWin || isDraw(board)) && index !== history.length - 1) {
      return { board, lastWin: null, error: 'Move history continues after the game finished' };
    }

    expectedPlayer = otherPlayer(move.player);
  }

  return { board, lastWin, error: null };
}

function boardsMatch(left: Board, right: Board): boolean {
  return left.every((column, columnIndex) =>
    column.every((cell, rowIndex) => cell === right[columnIndex]?.[rowIndex]),
  );
}

function linesMatch(left: WinningLine | null, right: WinningLine | null): boolean {
  if (!left || !right) return left === right;
  if (left.direction !== right.direction) return false;

  return (
    left.positions.every(
      (position, index) =>
        position.column === right.positions[index]?.column &&
        position.row === right.positions[index]?.row,
    ) && left.positions.length === right.positions.length
  );
}

function validateSetup(state: GameState): string[] {
  const errors: string[] = [];
  if (state.history.length !== 0) errors.push('A game in setup cannot have move history');
  if (state.currentPlayer !== 'player1') errors.push('A game in setup must reset to player1');
  if (state.winner || state.winningLine) errors.push('A game in setup cannot have a result');
  return errors;
}

function validatePlaying(state: GameState, replayed: ReplayResult): string[] {
  const errors: string[] = [];
  const lastMove = state.history.at(-1);

  if (state.winner || state.winningLine) errors.push('A playing game cannot have a result');
  if (replayed.lastWin || isDraw(replayed.board))
    errors.push('A playing game has already finished');
  if (lastMove && state.currentPlayer !== otherPlayer(lastMove.player)) {
    errors.push('Current player must follow the last player');
  }

  return errors;
}

function validateFinished(state: GameState, replayed: ReplayResult): string[] {
  const errors: string[] = [];
  const lastMove = state.history.at(-1);

  if (!lastMove) return ['A finished game must have move history'];
  if (state.currentPlayer !== lastMove.player)
    errors.push('Winner or drawing player must remain current');

  if (state.winner) {
    if (state.winner !== lastMove.player) errors.push('Only the last player can win');
    if (!linesMatch(state.winningLine, replayed.lastWin)) errors.push('Winning line is invalid');
  } else if (state.winningLine || replayed.lastWin || !isDraw(state.board)) {
    errors.push('A finished game without a winner must be a draw');
  }

  return errors;
}

export function gameStateInvariantErrors(state: GameState): string[] {
  const replayed = replay(state.history);
  if (replayed.error) return [replayed.error];

  const errors = boardsMatch(state.board, replayed.board)
    ? []
    : ['Board does not match move history'];
  if (state.gameStatus === 'not_started') return [...errors, ...validateSetup(state)];
  if (state.gameStatus === 'playing') return [...errors, ...validatePlaying(state, replayed)];
  return [...errors, ...validateFinished(state, replayed)];
}
