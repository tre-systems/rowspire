import type { WinningLine } from './types';

export interface WinningLinePoint {
  x: number;
  y: number;
}

export interface WinningLinePresentation {
  start: WinningLinePoint;
  end: WinningLinePoint;
  points: WinningLinePoint[];
}

export function presentWinningLine(line: WinningLine): WinningLinePresentation {
  const points = line.positions.map(({ column, row }) => ({
    x: column + 0.5,
    y: row + 0.5,
  }));

  const start = points[0];
  const end = points.at(-1);
  if (!start || !end) throw new Error('A winning line must contain positions');

  return { start, end, points };
}
