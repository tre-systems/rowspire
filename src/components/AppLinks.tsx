import { Github, Heart } from 'lucide-react';
import { APP_NAME, REPOSITORY_URL, SUPPORT_URL } from '@/lib/brand';

type AppLinksMode = 'floating' | 'inline' | 'footer';

interface AppLinksProps {
  mode: AppLinksMode;
}

const CONTAINER_CLASS: Record<AppLinksMode, string> = {
  floating: 'hidden sm:flex fixed bottom-5 left-1/2 z-50 -translate-x-1/2 items-center gap-5',
  inline: 'sm:hidden relative z-20 mt-6 mb-2 flex items-center justify-center gap-5',
  footer: 'relative z-20 mt-7 flex items-center justify-center gap-5',
};

export default function AppLinks({ mode }: AppLinksProps) {
  // The in-flow selection footer stands in for the fixed one, so it keeps the
  // "floating" test id that gates the opponent-selection smoke test.
  const testidSuffix = mode === 'inline' ? 'inline' : 'floating';
  const linkClass = 'opacity-60 hover:opacity-100 transition-opacity';
  const supportLinkClass =
    'inline-flex items-center gap-1.5 rounded-full border border-cyan-200/20 bg-black/25 px-3.5 py-1.5 text-[13px] font-semibold text-white/60 no-underline backdrop-blur-sm transition-colors hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-white';

  return (
    <div className={CONTAINER_CLASS[mode]} data-testid={`app-links-${mode}`}>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={supportLinkClass}
        aria-label="Support Rowspire on Ko-fi"
        data-testid={`ko-fi-link-${testidSuffix}`}
      >
        <Heart className="h-4 w-4" aria-hidden="true" />
        Support Rowspire
      </a>

      <a
        href={REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${APP_NAME} repository`}
        className={linkClass}
        data-testid={`github-link-${testidSuffix}`}
      >
        <Github className="h-6 w-6" />
      </a>
    </div>
  );
}
