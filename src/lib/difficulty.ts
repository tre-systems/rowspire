import type { Difficulty } from './types';

export type DifficultyProfile = {
  name: string;
  description: string;
  searchDepth: number;
  mlSimulations: number;
};

export const DIFFICULTIES = {
  relaxed: {
    name: 'Relaxed',
    description: 'A forgiving introduction with shorter plans and more chances to recover.',
    searchDepth: 2,
    mlSimulations: 32,
  },
  standard: {
    name: 'Standard',
    description: 'A thoughtful challenge that spots tactics without seeing everything.',
    searchDepth: 6,
    mlSimulations: 512,
  },
  expert: {
    name: 'Expert',
    description: 'The strongest opponents—bring your best game.',
    searchDepth: 14,
    mlSimulations: 4_000,
  },
} as const satisfies Record<Difficulty, DifficultyProfile>;

export const DIFFICULTY_ORDER = [
  'relaxed',
  'standard',
  'expert',
] as const satisfies readonly Difficulty[];
