import { Heart } from 'lucide-react';
import { REPOSITORY_URL, SUPPORT_URL } from '@/lib/brand';

export default function AppLinks() {
  return (
    <footer className="app-links" data-testid="app-links">
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Rowspire on Ko-fi"
        data-testid="ko-fi-link"
      >
        <Heart aria-hidden="true" />
        Support Rowspire
      </a>

      <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer" data-testid="github-link">
        Source on GitHub
      </a>
    </footer>
  );
}
