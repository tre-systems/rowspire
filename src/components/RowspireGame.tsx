import { useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useGameStore, useGameState, useGameActions } from '@/lib/game-store';
import { soundEffects } from '@/lib/sound-effects';
import { useUIStore } from '@/lib/ui-store';
import { APP_TAGLINE } from '@/lib/brand';
import GameBoard from './GameBoard';
import AnimatedBackground from './AnimatedBackground';
import HowToPlayPanel from './HowToPlayPanel';
import ErrorModal from './ErrorModal';
import AISelectionPanel from './AISelectionPanel';
import AppLinks from './AppLinks';
import BrandHeader from './BrandHeader';
import { MOTION } from '@/lib/visuals/motion';

function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);

  return () => {
    media.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function openCompactWindow() {
  window.open(
    '/',
    'RowspireCompactWindow',
    'width=420,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no',
  );
}

export default function RowspireGame() {
  const gameState = useGameState();
  const { makeAIMove, reset, startGame } = useGameActions();
  const aiThinking = useGameStore(state => state.aiThinking);
  const gameMode = useGameStore(state => state.gameMode);
  const errorModal = useUIStore(state => state.errorModal);
  const { hideError } = useUIStore(state => state.actions);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const isStandalone = useSyncExternalStore(subscribeStandalone, isStandalonePWA, () => false);
  const showAISelection = gameState.gameStatus === 'not_started';

  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    const shouldMakeAIMove =
      gameState.gameStatus === 'playing' &&
      !aiThinking &&
      (gameMode === 'ai-vs-ai' ||
        (gameMode === 'human-vs-ai' && gameState.currentPlayer === 'player2'));

    if (shouldMakeAIMove) {
      void makeAIMove();
    }
  }, [gameState.gameStatus, gameState.currentPlayer, aiThinking, makeAIMove, gameMode]);

  useEffect(() => {
    if (gameState.gameStatus === 'finished' && gameState.winner) {
      const timer = window.setTimeout(() => {
        if (gameState.winner === 'player1') {
          soundEffects.gameWin();
        } else {
          soundEffects.gameLoss();
        }
      }, 500);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [gameState.gameStatus, gameState.winner]);

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);

    if (newState) {
      void soundEffects.unlock();
    }
  };

  const handleStartGame = () => {
    if (soundEnabled) {
      void soundEffects.unlock();
    }

    startGame();
  };

  const closeHowToPlay = () => setShowHowToPlay(false);

  return (
    <>
      <AnimatedBackground />
      <div className="app-stage" data-testid="rowspire-game">
        {!isStandalone && (
          <div className="hidden md:block absolute top-4 right-4 z-50">
            <button
              type="button"
              onClick={openCompactWindow}
              className="compact-button"
              title="Play in a small window"
              aria-label="Play in a small window"
              data-testid="compact-window-button"
            >
              <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" />
              <span>Mini window</span>
            </button>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {showAISelection ? (
            <motion.section
              key="selection"
              className="selection-stage"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={MOTION.quick}
              data-testid="selection-stage"
            >
              <BrandHeader tagline="A quick strategy game with two very different opponents." />
              <AISelectionPanel onStartGame={handleStartGame} />
              <AppLinks mode="footer" />
            </motion.section>
          ) : (
            <motion.section
              key="game"
              className="game-stage"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={MOTION.quick}
              data-testid="game-stage"
            >
              <BrandHeader tagline={APP_TAGLINE} />
              <GameBoard
                gameState={gameState}
                aiThinking={aiThinking}
                onResetGame={reset}
                soundEnabled={soundEnabled}
                onToggleSound={toggleSound}
                onShowHowToPlay={() => setShowHowToPlay(true)}
                watchMode={gameMode === 'ai-vs-ai'}
                gameMode={gameMode}
              />
              <AppLinks mode="floating" />
              <AppLinks mode="inline" />
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <HowToPlayPanel isOpen={showHowToPlay} onClose={closeHowToPlay} />
      <ErrorModal isOpen={errorModal.isOpen} onClose={hideError} error={errorModal.error} />
    </>
  );
}
