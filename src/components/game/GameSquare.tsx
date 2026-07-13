import { AnimatePresence, motion } from 'framer-motion';
import type { Player } from '@/lib/types';
import GamePiece from './GamePiece';

interface GameSquareProps {
  column: number;
  row: number;
  player: Player | null;
  isWinning?: boolean;
  isDimmed?: boolean;
}

export default function GameSquare({
  column,
  row,
  player,
  isWinning = false,
  isDimmed = false,
}: GameSquareProps) {
  return (
    <div
      className="board-square"
      data-column={column}
      data-row={row}
      data-testid={`square-${column}-${row}`}
    >
      <AnimatePresence initial={false}>
        {player && (
          <motion.div
            key={`${player}-${column}-${row}`}
            className="h-[84%] w-[84%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: isDimmed ? 0.2 : 1, scale: isDimmed ? 0.88 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            data-testid={`piece-${column}-${row}`}
            data-winning={isWinning ? 'true' : undefined}
            data-dimmed={isDimmed ? 'true' : undefined}
          >
            <GamePiece player={player} isWinning={isWinning} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
