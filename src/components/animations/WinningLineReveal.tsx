import { motion } from 'framer-motion';
import type { Player, WinningLine } from '@/lib/types';
import { presentWinningLine } from '@/lib/winning-line-presentation';
import { EASE_OUT, WIN_REVEAL_DURATION_MS } from '@/lib/visuals/motion';

interface WinningLineRevealProps {
  line: WinningLine;
  player: Player;
  onComplete: () => void;
}

export default function WinningLineReveal({ line, player, onComplete }: WinningLineRevealProps) {
  const { start, end, points } = presentWinningLine(line);
  const duration = WIN_REVEAL_DURATION_MS / 1000;

  return (
    <motion.div
      className={`winning-line winning-line--${player}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1] }}
      transition={{ duration, times: [0, 0.08, 1], ease: EASE_OUT }}
      onAnimationComplete={onComplete}
      aria-hidden="true"
      data-testid="winning-line-reveal"
    >
      <svg viewBox="0 0 7 6" preserveAspectRatio="none">
        <motion.line
          className="winning-line__halo"
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          pathLength={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        />
        <motion.line
          className="winning-line__beam"
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          pathLength={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          data-testid="winning-line-beam"
        />
        {points.map((point, index) => (
          <motion.circle
            key={`${point.x}-${point.y}`}
            className="winning-line__point"
            cx={point.x}
            cy={point.y}
            r={0.37}
            initial={{ opacity: 0, scale: 0.45 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + index * 0.09, duration: 0.32, ease: EASE_OUT }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
