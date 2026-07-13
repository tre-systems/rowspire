import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Cpu, Crown, Trophy, XCircle, Zap, type LucideIcon } from 'lucide-react';
import type { GameMode, GameState } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { useHydrated } from '@/hooks/useHydrated';
import { presentGameStatus, type GameIcon } from '@/lib/game-presentation';
import { MOTION } from '@/lib/visuals/motion';

const STATUS_ICONS = {
  brain: Brain,
  cpu: Cpu,
  crown: Crown,
  trophy: Trophy,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<GameIcon, LucideIcon>;

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

  if (!isMounted) {
    return (
      <div className="game-status game-status--gray" data-testid="game-status-loading">
        <span>Preparing game</span>
      </div>
    );
  }

  return (
    <div className={`game-status game-status--${status.tone}`} data-testid="game-status">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${status.text}-${aiThinking}`}
          className="game-status__message"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={MOTION.quick}
        >
          <StatusIcon className="h-4 w-4" aria-hidden="true" data-testid="game-status-icon" />
          <span data-testid="game-status-text">{status.text}</span>
          {aiThinking && (
            <span
              className="thinking-dots"
              data-testid="game-status-thinking"
              aria-label="Thinking"
            >
              <i />
              <i />
              <i />
            </span>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="game-status__matchup" data-testid="game-status-matchup">
        {status.matchup ?? '\u00a0'}
      </div>
    </div>
  );
}
