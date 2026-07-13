import type { AIType } from './types';

export type OpponentProfile = {
  name: string;
  shortName: string;
  description: string;
  technicalName: string;
  action: string;
  technical: {
    summary: string;
    decision: readonly string[];
    training?: string;
    character: string;
  };
};

export const OPPONENTS: Record<AIType, OpponentProfile> = {
  search: {
    name: 'The Tactician',
    shortName: 'Tactician',
    description: 'Plans ahead and plays a precise, tactical game.',
    technicalName: 'Deterministic search AI',
    action: 'Play the Tactician',
    technical: {
      summary:
        'A deterministic opponent that is strongest at concrete tactics and makes the same choice whenever it sees the same position.',
      decision: [
        'The board is encoded as a compact bitboard. Negamax search explores alternating moves while alpha–beta pruning skips branches that cannot change the result.',
        'It examines centre columns first and caches positions in a transposition table. Unresolved positions at the search limit receive a neutral score, so shorter levels can miss plans that begin farther ahead.',
      ],
      character:
        'Methodical, consistent and tactically direct. It is especially good at forcing sequences within its horizon.',
    },
  },
  ml: {
    name: 'The Neural Challenger',
    shortName: 'Neural challenger',
    description: 'Plays a more varied, less predictable game.',
    technicalName: 'Neural-guided search AI',
    action: 'Play the Neural Challenger',
    technical: {
      summary:
        'A neural-guided opponent that explores promising futures instead of following one fixed tactical calculation.',
      decision: [
        'It first takes any immediate win or blocks an immediate loss. Otherwise, a policy network suggests promising columns while a value network estimates each position.',
        'Monte Carlo tree search uses those estimates to explore continuations, concentrating more work on promising lines. Exploration noise makes similar games less repetitive.',
      ],
      training:
        'Its fixed model was trained for 50 epochs on 500,000 labelled and mirrored positions. The teacher was the bitboard solver searching to 18 ply; separate policy and value networks each use four 128-unit hidden layers.',
      character:
        'Exploratory and less repeatable than the Tactician. Neural estimates are approximate, especially with smaller simulation budgets.',
    },
  },
};

export const OPPONENT_ORDER = ['search', 'ml'] as const satisfies readonly AIType[];
