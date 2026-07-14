import { AnimatePresence, motion } from 'framer-motion';
import type { GameMode, GameState } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { presentGameStatus } from '@/lib/game-presentation';
import { MOTION, STATUS_MIN_INTERVAL_MS } from '@/lib/visuals/motion';
import { useThrottledValue } from '@/hooks/useThrottledValue';
import { GAME_ICONS } from './game-icons';

interface GameStatusProps {
  gameState: GameState;
  aiThinking: boolean;
  gameMode: GameMode;
}

export default function GameStatus({ gameState, aiThinking, gameMode }: GameStatusProps) {
  const player1AI = useGameStore(state => state.player1AI);
  const player2AI = useGameStore(state => state.player2AI);
  const difficulty = useGameStore(state => state.difficulty);
  const status = presentGameStatus({
    gameState,
    gameMode,
    aiThinking,
    player1AI,
    player2AI,
    difficulty,
  });
  const thinking = aiThinking && gameState.gameStatus === 'playing';

  // Fast engines (especially watch mode) can flip turns many times a second.
  // Rate-limit what the banner shows so it changes calmly instead of flashing.
  const liveKey = `${status.tone}|${status.icon}|${status.text}|${thinking ? '1' : '0'}`;
  const calm = useThrottledValue(
    { text: status.text, icon: status.icon, tone: status.tone, thinking },
    liveKey,
    STATUS_MIN_INTERVAL_MS,
  );
  const calmKey = `${calm.tone}|${calm.icon}|${calm.text}|${calm.thinking ? '1' : '0'}`;
  const StatusIcon = GAME_ICONS[calm.icon];

  return (
    <div
      className={`game-status game-status--${calm.tone}`}
      role="status"
      aria-live="polite"
      data-testid="game-status"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={calmKey}
          className="game-status__message"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={MOTION.quick}
        >
          <StatusIcon className="h-4 w-4" aria-hidden="true" data-testid="game-status-icon" />
          <span data-testid="game-status-text">{calm.text}</span>
          {calm.thinking && (
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
