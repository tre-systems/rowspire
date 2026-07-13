import { describe, expect, it, vi } from 'vitest';
import { resolveBuildId } from '../../../scripts/build-id.mjs';

describe('resolveBuildId', () => {
  it('prefers the GitHub commit', () => {
    const getGitSha = vi.fn(() => 'git-sha');

    expect(resolveBuildId('1234567890', getGitSha)).toBe('1234567');
    expect(getGitSha).not.toHaveBeenCalled();
  });

  it('uses the local Git commit outside GitHub Actions', () => {
    expect(resolveBuildId(undefined, () => 'abcdef1')).toBe('abcdef1');
  });

  it('falls back when no commit is available', () => {
    expect(resolveBuildId(undefined, () => undefined)).toBe('local');
  });
});
