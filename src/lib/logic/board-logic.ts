import { BOARD_COLUMNS, BOARD_ROWS } from '../constants';
import type { Board, BoardPosition, Player, WinningLine } from '../types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_COLUMNS }, () =>
    Array.from({ length: BOARD_ROWS }, () => null),
  );
}

export function getValidMoves(board: Board): number[] {
  return board.flatMap((column, index) => (column.includes(null) ? [index] : []));
}

export function isDraw(board: Board): boolean {
  return board.every(col => col.every(cell => cell !== null));
}

export function checkWin(
  board: Board,
  col: number,
  row: number,
  player: Player,
): WinningLine | null {
  const horizontalLine = checkDirection(board, col, row, 1, 0, player);
  if (horizontalLine) return { positions: horizontalLine, direction: 'horizontal' };

  const verticalLine = checkDirection(board, col, row, 0, 1, player);
  if (verticalLine) return { positions: verticalLine, direction: 'vertical' };

  const diagonal1Line = checkDirection(board, col, row, 1, 1, player);
  if (diagonal1Line) return { positions: diagonal1Line, direction: 'diagonal' };

  const diagonal2Line = checkDirection(board, col, row, 1, -1, player);
  if (diagonal2Line) return { positions: diagonal2Line, direction: 'diagonal' };

  return null;
}

function checkDirection(
  board: Board,
  col: number,
  row: number,
  dCol: number,
  dRow: number,
  player: Player,
): BoardPosition[] | null {
  const positions: BoardPosition[] = [];

  let count = 1;
  positions.push({ column: col, row });
  let c = col + dCol;
  let r = row + dRow;
  while (c >= 0 && c < BOARD_COLUMNS && r >= 0 && r < BOARD_ROWS && board[c]?.[r] === player) {
    count++;
    positions.push({ column: c, row: r });
    c += dCol;
    r += dRow;
  }

  c = col - dCol;
  r = row - dRow;
  while (c >= 0 && c < BOARD_COLUMNS && r >= 0 && r < BOARD_ROWS && board[c]?.[r] === player) {
    count++;
    positions.unshift({ column: c, row: r });
    c -= dCol;
    r -= dRow;
  }

  return count >= 4 ? positions : null;
}
