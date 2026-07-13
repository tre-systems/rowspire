import { execFileSync } from 'node:child_process';

function readGitSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return undefined;
  }
}

export function resolveBuildId(githubSha, getGitSha = readGitSha) {
  return githubSha?.slice(0, 7) || getGitSha() || 'local';
}
