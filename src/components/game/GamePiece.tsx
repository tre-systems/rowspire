import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MOTION } from '@/lib/visuals/motion';

interface GamePieceProps {
  player: Player;
  isWinning?: boolean;
}

const GamePiece = memo(function Piece({ player, isWinning = false }: GamePieceProps) {
  return (
    <motion.div
      className={cn(
        'game-piece',
        player === 'player1' ? 'game-piece--teal' : 'game-piece--violet',
        isWinning && 'game-piece--winning',
      )}
      initial={{ opacity: 0.7, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={MOTION.spring}
      data-testid={`game-piece-${player}-static`}
    >
      <span className="game-piece__face" aria-hidden="true" />
      <span className="game-piece__mark" aria-hidden="true" />
      <span className="game-piece__shine" aria-hidden="true" />
    </motion.div>
  );
});

export default GamePiece;
