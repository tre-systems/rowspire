import { motion } from 'framer-motion';
import { Brain, Cpu, Eye, Sparkles } from 'lucide-react';
import { useGameActions } from '../lib/game-store';
import AISelectionCard from './AISelectionCard';
import type { AIType } from '../lib/types';
import { SEARCH_AI_DEPTH } from '../lib/constants';

const AI_OPTIONS = [
  {
    aiType: 'search' as AIType,
    title: 'Search AI',
    description: 'A tactical opponent using minimax search with alpha-beta pruning.',
    subtitle: `Minimax + Alpha-Beta (Depth ${SEARCH_AI_DEPTH})`,
    icon: Cpu,
  },
  {
    aiType: 'ml' as AIType,
    title: 'ML AI',
    description: 'A modern opponent that learned by observing thousands of games.',
    subtitle: 'Policy + Value Neural Network',
    icon: Brain,
  },
];

interface AISelectionPanelProps {
  onStartGame?: () => void;
}

export default function AISelectionPanel({ onStartGame }: AISelectionPanelProps) {
  const actions = useGameActions();

  const handleAISelection = (aiType: AIType) => {
    actions.setAI(aiType);
    actions.setGameMode('human-vs-ai');
    actions.reset();
    onStartGame?.();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
      }}
      className="selection-panel"
      data-testid="ai-selection-panel"
    >
      <motion.div
        className="selection-heading"
        variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
      >
        <span className="selection-eyebrow">
          <Sparkles aria-hidden="true" />
          Two minds. Two styles.
        </span>
        <h2>Select Your Opponent</h2>
        <p>Outthink a tactical search engine or challenge a learned neural network.</p>
      </motion.div>

      <div className="selection-grid">
        {AI_OPTIONS.map(option => (
          <AISelectionCard
            key={option.aiType}
            aiType={option.aiType}
            title={option.title}
            description={option.description}
            subtitle={option.subtitle}
            icon={option.icon}
            onClick={() => handleAISelection(option.aiType)}
            data-testid={`ai-selection-${option.aiType}`}
          />
        ))}
      </div>

      <motion.div
        className="flex justify-center"
        variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
      >
        <motion.button
          onClick={() => {
            actions.setPlayer1AI('search');
            actions.setPlayer2AI('ml');
            actions.setGameMode('ai-vs-ai');
            actions.reset();
            onStartGame?.();
          }}
          className="watch-button"
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid="ai-vs-ai-button"
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span>Watch Search AI vs ML AI</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
