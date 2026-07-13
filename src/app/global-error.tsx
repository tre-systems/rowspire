'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100"
          data-testid="global-error"
        >
          <div className="mx-auto flex max-w-md flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">
              Rowspire
            </p>
            <h1 className="text-3xl font-bold">The game hit a problem.</h1>
            <p className="text-base leading-7 text-slate-300">
              Reset the board view and try again. The error has been reported without personal data.
            </p>
            <button
              type="button"
              onClick={reset}
              className="w-fit rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200"
              data-testid="global-error-reset"
            >
              Reset view
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
