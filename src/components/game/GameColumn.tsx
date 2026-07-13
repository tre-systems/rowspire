import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';
import GameSquare from './GameSquare';

interface GameColumnProps {
  cells: GameState['board'][number];
  column: number;
  canPlay: boolean;
  winningPositions: ReadonlySet<string>;
  onSelect: (column: number) => void;
}

export default function GameColumn({
  cells,
  column,
  canPlay,
  winningPositions,
  onSelect,
}: GameColumnProps) {
  const isClickable = canPlay && cells.includes(null);

  return (
    <motion.button
      type="button"
      className="game-column"
      onClick={() => onSelect(column)}
      disabled={!isClickable}
      aria-label={`Drop counter in column ${column + 1}`}
      whileTap={isClickable ? { scale: 0.975 } : {}}
      transition={MOTION.spring}
      data-testid={`column-${column}`}
    >
      {cells.map((player, row) => (
        <GameSquare
          key={`${column}-${row}`}
          column={column}
          row={row}
          player={player}
          isWinning={winningPositions.has(`${column},${row}`)}
        />
      ))}
    </motion.button>
  );
}
