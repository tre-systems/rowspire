import { describe, expect, it } from 'vitest';
import { presentWinningLine } from '../winning-line-presentation';
import type { WinningLine } from '../types';

describe('presentWinningLine', () => {
  it.each([
    {
      direction: 'horizontal',
      positions: [
        { column: 1, row: 5 },
        { column: 2, row: 5 },
        { column: 3, row: 5 },
        { column: 4, row: 5 },
      ],
      start: { x: 1.5, y: 5.5 },
      end: { x: 4.5, y: 5.5 },
    },
    {
      direction: 'vertical',
      positions: [
        { column: 3, row: 2 },
        { column: 3, row: 3 },
        { column: 3, row: 4 },
        { column: 3, row: 5 },
      ],
      start: { x: 3.5, y: 2.5 },
      end: { x: 3.5, y: 5.5 },
    },
    {
      direction: 'diagonal',
      positions: [
        { column: 1, row: 5 },
        { column: 2, row: 4 },
        { column: 3, row: 3 },
        { column: 4, row: 2 },
      ],
      start: { x: 1.5, y: 5.5 },
      end: { x: 4.5, y: 2.5 },
    },
  ] satisfies Array<WinningLine & { start: unknown; end: unknown }>)(
    'maps a $direction win to cell centres',
    ({ direction, positions, start, end }) => {
      const result = presentWinningLine({ direction, positions });

      expect(result.start).toEqual(start);
      expect(result.end).toEqual(end);
      expect(result.points).toHaveLength(positions.length);
    },
  );
});
