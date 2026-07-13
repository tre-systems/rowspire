import * as Sentry from '@sentry/browser';
import { makeBrowserOfflineTransport, type ErrorEvent } from '@sentry/browser';
import { produce } from 'immer';

const SENSITIVE_KEYS = [
  'accessToken',
  'apiKey',
  'authorization',
  'cookie',
  'gameState',
  'generatedContent',
  'moves',
  'password',
  'prompt',
  'requestBody',
  'response',
  'seed',
  'secret',
  'session',
  'text',
  'token',
].map(key => key.toLowerCase());

function isSensitive(key: string) {
  return SENSITIVE_KEYS.includes(key.replaceAll(/[-_]/g, '').toLowerCase());
}

function filterValue(value: unknown, key: string, seen = new WeakSet<object>()): unknown {
  if (isSensitive(key)) return '[Filtered]';
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  if (Array.isArray(value)) return value.map(item => filterValue(item, '', seen));

  return Object.fromEntries(
    Object.entries(value).map(([childKey, child]) => [
      childKey,
      filterValue(child, childKey, seen),
    ]),
  );
}

function filterUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return undefined;
  }
}

function filterRequest(request: NonNullable<ErrorEvent['request']>) {
  const safe = Object.fromEntries(
    Object.entries(request).filter(
      ([key]) => !['cookies', 'data', 'query_string', 'url'].includes(key),
    ),
  );
  const url = filterUrl(request.url);
  const headers = Object.fromEntries(
    Object.entries(request.headers ?? {}).map(([key, value]) => [
      key,
      /authorization|cookie|api[-_]?key|token|secret/i.test(key) ? '[Filtered]' : value,
    ]),
  );
  return { ...safe, ...(url ? { url } : {}), headers };
}

function beforeSend(event: ErrorEvent): ErrorEvent {
  return produce(event, draft => {
    delete draft.user;
    if (draft.extra) draft.extra = filterValue(draft.extra, '') as typeof draft.extra;
    if (draft.request) draft.request = filterRequest(draft.request);
  });
}

export function initializeObservability() {
  const dsn = import.meta.env['VITE_SENTRY_DSN'];
  if (!dsn) return;

  const offlineTransport = makeBrowserOfflineTransport();
  Sentry.init({
    dsn,
    environment: import.meta.env['VITE_SENTRY_ENVIRONMENT'] ?? import.meta.env.MODE,
    release: import.meta.env['VITE_SENTRY_RELEASE'],
    sendDefaultPii: false,
    transport: options => offlineTransport({ ...options, shouldSend: () => navigator.onLine }),
    tracesSampleRate: import.meta.env.PROD ? 0.01 : 0,
    beforeSend,
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
