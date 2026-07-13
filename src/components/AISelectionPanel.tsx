import { motion } from 'framer-motion';
import { Brain, Cpu, Eye, Sparkles, type LucideIcon } from 'lucide-react';
import { useGameActions, useGameStore } from '@/lib/game-store';
import { OPPONENT_ORDER, OPPONENTS } from '@/lib/opponents';
import type { AIType } from '@/lib/types';
import AISelectionCard from './AISelectionCard';
import DifficultySelector from './DifficultySelector';

const ICONS = { search: Cpu, ml: Brain } satisfies Record<AIType, LucideIcon>;

const PANEL_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

interface AISelectionPanelProps {
  onStartGame?: () => void;
}

export default function AISelectionPanel({ onStartGame }: AISelectionPanelProps) {
  const actions = useGameActions();
  const difficulty = useGameStore(state => state.difficulty);

  const launchGame = () => {
    actions.reset();
    onStartGame?.();
  };

  const handleAISelection = (aiType: AIType) => {
    actions.setAI(aiType);
    actions.setGameMode('human-vs-ai');
    launchGame();
  };

  const handleWatchGame = () => {
    actions.setPlayer1AI('search');
    actions.setPlayer2AI('ml');
    actions.setGameMode('ai-vs-ai');
    launchGame();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={PANEL_VARIANTS}
      className="selection-panel"
      data-testid="ai-selection-panel"
    >
      <motion.div className="selection-heading" variants={ITEM_VARIANTS}>
        <span className="selection-eyebrow">
          <Sparkles aria-hidden="true" />
          Choose your challenge
        </span>
        <h2>Who would you like to play?</h2>
        <p>Pick the style that sounds fun. Open “How it works” for the technical details.</p>
      </motion.div>

      <motion.div variants={ITEM_VARIANTS}>
        <DifficultySelector difficulty={difficulty} onChange={actions.setDifficulty} />
      </motion.div>

      <div className="selection-grid">
        {OPPONENT_ORDER.map(aiType => (
          <AISelectionCard
            key={aiType}
            aiType={aiType}
            profile={OPPONENTS[aiType]}
            icon={ICONS[aiType]}
            onClick={() => handleAISelection(aiType)}
            data-testid={`ai-selection-${aiType}`}
          />
        ))}
      </div>

      <motion.div className="flex justify-center" variants={ITEM_VARIANTS}>
        <motion.button
          type="button"
          onClick={handleWatchGame}
          className="watch-button"
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid="ai-vs-ai-button"
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span>Watch both opponents play</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
