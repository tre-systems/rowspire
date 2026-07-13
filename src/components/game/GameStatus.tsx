import { AnimatePresence, motion } from 'framer-motion';
import type { GameMode, GameState } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { presentGameStatus } from '@/lib/game-presentation';
import { MOTION } from '@/lib/visuals/motion';
import { GAME_ICONS } from './game-icons';

interface GameStatusProps {
  gameState: GameState;
  aiThinking: boolean;
  gameMode: GameMode;
}

export default function GameStatus({ gameState, aiThinking, gameMode }: GameStatusProps) {
  const player1AI = useGameStore(state => state.player1AI);
  const player2AI = useGameStore(state => state.player2AI);
  const status = presentGameStatus({ gameState, gameMode, aiThinking, player1AI, player2AI });
  const StatusIcon = GAME_ICONS[status.icon];

  return (
    <div
      className={`game-status game-status--${status.tone}`}
      role="status"
      aria-live="polite"
      data-testid="game-status"
    >
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
              <span />
              <span />
              <span />
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
