import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../difficulty';

describe('difficulty profiles', () => {
  it('increases both strategy budgets at every level', () => {
    const profiles = DIFFICULTY_ORDER.map(level => DIFFICULTIES[level]);

    for (let index = 1; index < profiles.length; index += 1) {
      expect(profiles[index]?.searchDepth).toBeGreaterThan(profiles[index - 1]?.searchDepth ?? 0);
      expect(profiles[index]?.mlSimulations).toBeGreaterThan(
        profiles[index - 1]?.mlSimulations ?? 0,
      );
    }
  });
});
