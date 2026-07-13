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
    description: 'Best for learning the game, with more chances to recover.',
    searchDepth: 2,
    mlSimulations: 32,
  },
  standard: {
    name: 'Standard',
    description: 'A fair challenge once you know the basics.',
    searchDepth: 6,
    mlSimulations: 512,
  },
  expert: {
    name: 'Expert',
    description: 'The strongest level—bring your best game.',
    searchDepth: 14,
    mlSimulations: 4_000,
  },
} as const satisfies Record<Difficulty, DifficultyProfile>;

export const DIFFICULTY_ORDER = [
  'relaxed',
  'standard',
  'expert',
] as const satisfies readonly Difficulty[];
