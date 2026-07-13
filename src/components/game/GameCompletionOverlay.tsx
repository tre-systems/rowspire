import { motion } from 'framer-motion';
import { Trophy, Zap, Brain, Cpu, Crown, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameState, GameMode } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { presentGameCompletion, type GameIcon, type GameTone } from '@/lib/game-presentation';

const COMPLETION_ICONS = {
  brain: Brain,
  cpu: Cpu,
  crown: Crown,
  trophy: Trophy,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<GameIcon, LucideIcon>;

const COMPLETION_COLORS = {
  gray: 'text-gray-400',
  green: 'text-green-400',
  pink: 'text-pink-400',
  teal: 'text-teal-300',
  violet: 'text-violet-300',
} satisfies Record<GameTone, string>;

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
  const presentation = presentGameCompletion({
    gameState,
    gameMode,
    player1AI,
    player2AI,
  });
  const Icon = presentation.icon ? COMPLETION_ICONS[presentation.icon] : null;
  const color = COMPLETION_COLORS[presentation.tone];

  return (
    <motion.div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="game-completion-overlay"
    >
      <motion.div
        className="glass rounded-lg p-8 text-center shadow-2xl max-w-sm mx-4 relative overflow-hidden"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.div
          className="text-center relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          {Icon && (
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.5,
                }}
              >
                <Icon className={cn('w-20 h-20 mx-auto mb-4 drop-shadow-lg', color)} />
              </motion.div>
            </motion.div>
          )}

          <motion.h2
            className={cn('text-4xl font-bold neon-text mb-6', color)}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.8,
            }}
            data-testid="game-completion-title"
          >
            {presentation.title}
          </motion.h2>

          <motion.div
            className="text-white/80 mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 1.0,
            }}
          >
            <p className="text-lg mb-3" data-testid="game-completion-message">
              {presentation.message}
            </p>
            {presentation.matchup && (
              <p className="text-sm text-gray-300" data-testid="game-completion-matchup">
                {presentation.matchup}
              </p>
            )}
          </motion.div>

          <motion.button
            onClick={onResetGame}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg relative overflow-hidden group"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            data-testid="reset-game-button"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: 1.5,
              }}
            />
            <span className="relative z-10">Play Again</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
