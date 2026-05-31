'use client';

import { Github } from 'lucide-react';
import Image from 'next/image';
import { APP_NAME, REPOSITORY_URL, SUPPORT_URL } from '@/lib/brand';

interface AppLinksProps {
  mode: 'floating' | 'inline';
}

export default function AppLinks({ mode }: AppLinksProps) {
  const isFloating = mode === 'floating';
  const containerClass = isFloating
    ? 'hidden sm:flex fixed bottom-5 left-1/2 z-50 -translate-x-1/2 items-center gap-5'
    : 'sm:hidden relative z-20 mt-6 mb-2 flex items-center justify-center gap-5';
  const linkClass = 'opacity-60 hover:opacity-100 transition-opacity';

  return (
    <div className={containerClass} data-testid={`app-links-${mode}`}>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Support ${APP_NAME}`}
        className={linkClass}
        data-testid={`ko-fi-link-${mode}`}
      >
        <Image
          height={36}
          width={120}
          style={{ border: '0px', height: '36px' }}
          src="https://storage.ko-fi.com/cdn/kofi2.png?v=6"
          alt={`Support ${APP_NAME} development on Ko-fi`}
        />
      </a>

      <a
        href={REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${APP_NAME} repository`}
        className={linkClass}
        data-testid={`github-link-${mode}`}
      >
        <Github className="h-6 w-6" />
      </a>
    </div>
  );
}
