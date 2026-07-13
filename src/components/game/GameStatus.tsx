'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GameState, GameMode } from '@/lib/types';
import { Crown, Zap, Trophy, XCircle, Brain, Cpu, type LucideIcon } from 'lucide-react';
import { useGameStore } from '@/lib/game-store';
import { useHydrated } from '@/hooks/useHydrated';
import { presentGameStatus, type GameIcon, type GameTone } from '@/lib/game-presentation';

const STATUS_ICONS = {
  brain: Brain,
  cpu: Cpu,
  crown: Crown,
  trophy: Trophy,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<GameIcon, LucideIcon>;

const STATUS_COLORS = {
  gray: 'text-gray-400',
  green: 'text-green-400',
  pink: 'text-pink-400',
  teal: 'text-teal-300',
  violet: 'text-violet-300',
} satisfies Record<GameTone, string>;

interface GameStatusProps {
  gameState: GameState;
  aiThinking: boolean;
  gameMode?: GameMode;
}

export default function GameStatus({
  gameState,
  aiThinking,
  gameMode = 'human-vs-ai',
}: GameStatusProps) {
  const isMounted = useHydrated();
  const player1AI = useGameStore(state => state.player1AI);
  const player2AI = useGameStore(state => state.player2AI);
  const status = presentGameStatus({ gameState, gameMode, aiThinking, player1AI, player2AI });
  const StatusIcon = STATUS_ICONS[status.icon];
  const color = STATUS_COLORS[status.tone];

  if (!isMounted) {
    return (
      <div className="text-center mb-3" data-testid="game-status-loading">
        <div className="mt-2 h-10 flex flex-col justify-start relative pt-1">
          <div className="flex items-center justify-center space-x-2 h-6">
            <span className="font-bold text-lg text-gray-400">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-3" data-testid="game-status">
      <div className="mt-2 h-10 flex flex-col justify-start relative pt-1">
        <motion.div
          className="flex items-center justify-center space-x-2 h-6"
          animate={{ scale: aiThinking ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: aiThinking ? Infinity : 0, duration: 1 }}
        >
          <StatusIcon className={cn('w-4 h-4', color)} data-testid="game-status-icon" />
          <span
            className={cn('font-bold text-lg', color, 'neon-text')}
            data-testid="game-status-text"
          >
            {status.text}
          </span>
        </motion.div>

        {status.matchup && (
          <motion.div
            className="text-xs text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            data-testid="game-status-matchup"
          >
            {status.matchup}
          </motion.div>
        )}

        <AnimatePresence>
          {aiThinking && (
            <motion.div
              className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-testid="game-status-thinking"
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-violet-300 rounded-full"
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
