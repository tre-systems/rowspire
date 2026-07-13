'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useGameStore, useGameState, useGameActions } from '@/lib/game-store';
import { soundEffects } from '@/lib/sound-effects';
import { useUIStore } from '@/lib/ui-store';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';
import { useHydrated } from '@/hooks/useHydrated';
import GameBoard from './GameBoard';
import AnimatedBackground from './AnimatedBackground';
import HowToPlayPanel from './HowToPlayPanel';
import ErrorModal from './ErrorModal';
import AISelectionPanel from './AISelectionPanel';
import AppLinks from './AppLinks';

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

export default function RowspireGame() {
  const gameState = useGameState();
  const { makeAIMove, reset, startGame } = useGameActions();
  const aiThinking = useGameStore(state => state.aiThinking);
  const gameMode = useGameStore(state => state.gameMode);
  const { errorModal } = useUIStore();
  const { hideError } = useUIStore(state => state.actions);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const isMounted = useHydrated();
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

  const handleReset = () => {
    reset();
  };

  const toggleSound = () => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);

    if (newState) {
      void soundEffects.unlock();
    }
  };

  const handleShowHowToPlay = () => {
    setShowHowToPlay(true);
  };

  const handleCloseHowToPlay = () => {
    setShowHowToPlay(false);
  };

  const handleStartGame = () => {
    if (soundEnabled) {
      void soundEffects.unlock();
    }

    startGame();
  };

  return (
    <>
      <AppLinks mode="floating" />
      <AnimatedBackground />
      <div
        className="relative min-h-screen w-full flex items-center justify-center p-4 pb-24"
        data-testid="rowspire-game"
      >
        {!isStandalone && (
          <div className="hidden md:block absolute top-4 right-4 z-50">
            <button
              onClick={() => {
                window.open(
                  '/',
                  'RowspireCompactWindow',
                  'width=420,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no',
                );
              }}
              className="glass-dark rounded-lg px-4 py-2 flex items-center space-x-2 text-white/80 hover:text-white font-semibold shadow-lg backdrop-blur-md border border-white/10 transition-colors"
              title="Open Compact Window"
              data-testid="compact-window-button"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              <span>Compact Window</span>
            </button>
          </div>
        )}

        {showAISelection ? (
          <div className="w-full">
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2 title-glow">{APP_NAME}</h1>
              <p className="text-gray-300 text-sm">
                Challenge search-based and neural-network AI opponents.
              </p>
            </motion.div>

            <AISelectionPanel onStartGame={handleStartGame} />
            <AppLinks mode="inline" />
          </div>
        ) : (
          <div className="w-full max-w-md">
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2 title-glow">{APP_NAME}</h1>
              <p className="text-gray-300 text-sm">{APP_TAGLINE}</p>
              {process.env.NODE_ENV === 'development' && isMounted && (
                <div className="text-xs text-gray-500 mt-2">
                  Status: {gameState.gameStatus} | Player: {gameState.currentPlayer} | AI Thinking:{' '}
                  {aiThinking ? 'Yes' : 'No'}
                </div>
              )}
            </motion.div>

            <GameBoard
              gameState={gameState}
              aiThinking={aiThinking}
              onResetGame={handleReset}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onShowHowToPlay={handleShowHowToPlay}
              watchMode={gameMode === 'ai-vs-ai'}
              gameMode={gameMode}
            />
            <AppLinks mode="inline" />
          </div>
        )}
      </div>

      <HowToPlayPanel isOpen={showHowToPlay} onClose={handleCloseHowToPlay} />
      <ErrorModal isOpen={errorModal.isOpen} onClose={hideError} error={errorModal.error} />
    </>
  );
}
