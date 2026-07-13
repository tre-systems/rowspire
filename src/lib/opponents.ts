import { SEARCH_AI_DEPTH } from './constants';
import type { AIType } from './types';

export type OpponentProfile = {
  name: string;
  shortName: string;
  description: string;
  technicalName: string;
  technicalSummary: string;
  action: string;
};

export const OPPONENTS = {
  search: {
    name: 'The Tactician',
    shortName: 'Tactician',
    description: 'A focused opponent that plans ahead and looks for clever traps.',
    technicalName: 'Search AI',
    technicalSummary: `Minimax search with alpha–beta pruning, looking ${SEARCH_AI_DEPTH} moves ahead.`,
    action: 'Play the Tactician',
  },
  ml: {
    name: 'The Neural Challenger',
    shortName: 'Neural challenger',
    description: 'A more surprising opponent shaped by 500,000 carefully evaluated positions.',
    technicalName: 'ML AI',
    technicalSummary:
      'A policy-and-value neural network guides Monte Carlo tree search (MCTS), with immediate win and block safeguards.',
    action: 'Play the Neural Challenger',
  },
} as const satisfies Record<AIType, OpponentProfile>;

export const OPPONENT_ORDER = ['search', 'ml'] as const satisfies readonly AIType[];
