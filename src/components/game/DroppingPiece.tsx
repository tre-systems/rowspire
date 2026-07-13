import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';
import { EASE_OUT } from '@/lib/visuals/motion';
import GamePiece from './GamePiece';

interface DroppingPieceProps {
  column: number;
  row: number;
  player: Player;
}

export default function DroppingPiece({ column, row, player }: DroppingPieceProps) {
  const distance = `calc(-${(row + 1) * 100}% - ${row * 4}px)`;

  return (
    <motion.div
      className="flex items-center justify-center p-0.5"
      style={{ gridColumn: column + 1, gridRow: row + 1 }}
      initial={{ y: distance, opacity: 0.55, scale: 0.82 }}
      animate={{ y: 0, opacity: 1, scale: [0.82, 1.06, 1] }}
      transition={{ duration: 0.56, ease: EASE_OUT, times: [0, 0.86, 1] }}
      data-testid="dropping-piece"
    >
      <GamePiece player={player} />
    </motion.div>
  );
}
