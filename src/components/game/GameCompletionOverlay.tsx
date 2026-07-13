import { motion } from 'framer-motion';
import { Brain, Cpu, Crown, Trophy, XCircle, Zap, type LucideIcon } from 'lucide-react';
import type { GameMode, GameState } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { presentGameCompletion, type GameIcon } from '@/lib/game-presentation';
import { MOTION } from '@/lib/visuals/motion';

const COMPLETION_ICONS = {
  brain: Brain,
  cpu: Cpu,
  crown: Crown,
  trophy: Trophy,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<GameIcon, LucideIcon>;

interface GameCompletionOverlayProps {
  gameState: GameState;
  onResetGame: () => void;
  gameMode?: GameMode;
}

export default function GameCompletionOverlay({
  gameState,
  onResetGame,
  gameMode = 'human-vs-ai',
}: GameCompletionOverlayProps) {
  const player1AI = useGameStore(state => state.player1AI);
  const player2AI = useGameStore(state => state.player2AI);
  const presentation = presentGameCompletion({ gameState, gameMode, player1AI, player2AI });
  const Icon = presentation.icon ? COMPLETION_ICONS[presentation.icon] : Trophy;

  return (
    <motion.div
      className="completion-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={MOTION.quick}
      data-testid="game-completion-overlay"
    >
      <motion.div
        className={`completion-card completion-card--${presentation.tone}`}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={MOTION.spring}
      >
        <motion.div
          className="completion-icon"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...MOTION.spring, delay: 0.08 }}
        >
          <Icon aria-hidden="true" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...MOTION.quick, delay: 0.12 }}
          data-testid="game-completion-title"
        >
          {presentation.title}
        </motion.h2>
        <p data-testid="game-completion-message">{presentation.message}</p>
        {presentation.matchup && (
          <small data-testid="game-completion-matchup">{presentation.matchup}</small>
        )}
        <motion.button
          onClick={onResetGame}
          className="primary-action"
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={MOTION.spring}
          data-testid="reset-game-button"
        >
          Play again
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
