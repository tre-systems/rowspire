import { motion } from 'framer-motion';
import { WIN_REVEAL_DURATION_MS } from '@/lib/visuals/motion';

export default function WinningLineBurst({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="winning-burst"
      initial={{ opacity: 0, scale: 0.65 }}
      animate={{ opacity: [0, 1, 0], scale: [0.65, 1.04, 1.18] }}
      exit={{ opacity: 0 }}
      transition={{ duration: WIN_REVEAL_DURATION_MS / 1000, times: [0, 0.28, 1] }}
      onAnimationComplete={onComplete}
      aria-hidden="true"
      data-testid="winning-line-burst"
    >
      <span />
      <span />
      <span />
    </motion.div>
  );
}
