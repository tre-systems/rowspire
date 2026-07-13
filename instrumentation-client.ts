import * as Sentry from '@sentry/nextjs';
import { makeBrowserOfflineTransport } from '@sentry/browser';

import { beforeSend, tracesSampleRate } from './sentry.shared.config';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const makeOfflineTransport = makeBrowserOfflineTransport();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    sendDefaultPii: false,
    transport: (options: Parameters<typeof makeOfflineTransport>[0]) =>
      makeOfflineTransport({ ...options, shouldSend: () => navigator.onLine }),
    tracesSampleRate: tracesSampleRate(),
    beforeSend,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
