import * as Sentry from '@sentry/browser';
import { makeBrowserOfflineTransport, type ErrorEvent, type EventHint } from '@sentry/browser';

const SENSITIVE_KEYS = new Set([
  'apiKey',
  'authorization',
  'cookie',
  'gameState',
  'generatedContent',
  'moves',
  'prompt',
  'requestBody',
  'response',
  'seed',
  'text',
]);

function beforeSend(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request) {
    event.request.headers = Object.fromEntries(
      Object.entries(event.request.headers ?? {}).map(([key, value]) => [
        key,
        /authorization|cookie/i.test(key) ? '[Filtered]' : value,
      ]),
    );
    delete event.request.cookies;
    delete event.request.data;
  }

  Object.keys(event.extra ?? {}).forEach(key => {
    if (SENSITIVE_KEYS.has(key) && event.extra) event.extra[key] = '[Filtered]';
  });
  return event;
}

export function initializeObservability() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  const offlineTransport = makeBrowserOfflineTransport();
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    sendDefaultPii: false,
    transport: options => offlineTransport({ ...options, shouldSend: () => navigator.onLine }),
    tracesSampleRate: import.meta.env.PROD ? 0.01 : 0,
    beforeSend,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
