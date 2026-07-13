import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';
import { EASE_OUT } from '@/lib/visuals/motion';

const PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const distance = 90 + (index % 4) * 28;

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: index % 2 === 0 ? 220 : -220,
    delay: (index % 3) * 0.025,
  };
});

interface VictoryCelebrationProps {
  position: { x: number; y: number };
  player: Player;
}

export default function VictoryCelebration({ position, player }: VictoryCelebrationProps) {
  return (
    <div
      className={`victory-celebration victory-celebration--${player}`}
      style={{ left: position.x, top: position.y }}
      aria-hidden="true"
      data-testid="victory-celebration"
    >
      {PARTICLES.map((particle, index) => (
        <motion.span
          key={index}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
          animate={{
            x: particle.x,
            y: particle.y + 45,
            opacity: [0, 1, 1, 0],
            scale: [0.2, 1, 0.8],
            rotate: particle.rotate,
          }}
          transition={{ duration: 1.2, delay: particle.delay, ease: EASE_OUT }}
        />
      ))}
      <motion.strong
        initial={{ opacity: 0, scale: 0.6, y: 12 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.06, 1], y: [12, -8, -18] }}
        transition={{ duration: 1.35, ease: EASE_OUT }}
      >
        Four in a row!
      </motion.strong>
    </div>
  );
}
