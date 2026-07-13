import { motion } from 'framer-motion';
import { HelpCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { MOTION } from '@/lib/visuals/motion';

interface GameControlsProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  onResetGame: () => void;
}

export default function GameControls({
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  onResetGame,
}: GameControlsProps) {
  return (
    <div className="game-controls" data-testid="game-controls">
      <motion.button
        type="button"
        onClick={onResetGame}
        className="control-button control-button--labelled"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={MOTION.spring}
        aria-label="Start a new game"
        title="Start a new game"
        data-testid="reset-game"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span>New game</span>
      </motion.button>

      <div className="flex items-center gap-2.5">
        <motion.button
          type="button"
          onClick={onToggleSound}
          className="control-button control-button--labelled"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={MOTION.spring}
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
          data-testid="toggle-sound"
        >
          {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          <span>{soundEnabled ? 'Sound on' : 'Sound off'}</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onShowHowToPlay}
          className="control-button control-button--labelled"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={MOTION.spring}
          aria-label="How to play"
          title="How to Play"
          data-testid="how-to-play"
        >
          <HelpCircle aria-hidden="true" />
          <span>Help</span>
        </motion.button>
      </div>
    </div>
  );
}
