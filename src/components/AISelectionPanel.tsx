import { motion } from 'framer-motion';
import { Brain, Cpu, Eye } from 'lucide-react';
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
    colorClass: 'text-cyan-300',
    borderColorClass: 'border-cyan-500/50',
    icon: Cpu,
  },
  {
    aiType: 'ml' as AIType,
    title: 'ML AI',
    description: 'A modern opponent that learned by observing thousands of games.',
    subtitle: 'Policy + Value Neural Network',
    colorClass: 'text-purple-400',
    borderColorClass: 'border-purple-500/50',
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto p-4"
      data-testid="ai-selection-panel"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">Select Your Opponent</h2>
        <p className="text-gray-300 text-lg">Choose an AI to challenge, or watch them battle.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-2 mb-8">
        {AI_OPTIONS.map(option => (
          <AISelectionCard
            key={option.aiType}
            aiType={option.aiType}
            title={option.title}
            description={option.description}
            subtitle={option.subtitle}
            colorClass={option.colorClass}
            borderColorClass={option.borderColorClass}
            icon={option.icon}
            onClick={() => handleAISelection(option.aiType)}
            data-testid={`ai-selection-${option.aiType}`}
          />
        ))}
      </div>

      <div className="text-center">
        <motion.button
          onClick={() => {
            actions.setPlayer1AI('search');
            actions.setPlayer2AI('ml');
            actions.setGameMode('ai-vs-ai');
            actions.reset();
            onStartGame?.();
          }}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="ai-vs-ai-button"
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
          <span>Watch Search AI vs ML AI</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
