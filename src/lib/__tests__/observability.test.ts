import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureException, initializeObservability } from '../observability';

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn(),
  offlineTransport: vi.fn(),
  makeBrowserOfflineTransport: vi.fn(),
}));

vi.mock('@sentry/browser', () => ({
  captureException: sentry.captureException,
  init: sentry.init,
  makeBrowserOfflineTransport: sentry.makeBrowserOfflineTransport,
}));

describe('observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    sentry.makeBrowserOfflineTransport.mockReturnValue(sentry.offlineTransport);
  });

  it('stays disabled without a DSN', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');

    initializeObservability();

    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('configures offline delivery and filters sensitive event data', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.test/1');
    vi.stubEnv('VITE_SENTRY_ENVIRONMENT', 'test');
    initializeObservability();

    const options = sentry.init.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      dsn: 'https://public@example.test/1',
      environment: 'test',
      sendDefaultPii: false,
    });

    const event = options?.beforeSend({
      request: {
        headers: { Authorization: 'secret', Accept: 'application/json' },
        cookies: { session: 'secret' },
        data: 'secret',
      },
      extra: { Prompt: 'secret', score: 4 },
    });

    expect(event).toEqual({
      request: {
        headers: { Authorization: '[Filtered]', Accept: 'application/json' },
      },
      extra: { Prompt: '[Filtered]', score: 4 },
    });

    options?.transport({ sample: true });
    expect(sentry.offlineTransport).toHaveBeenCalledWith(
      expect.objectContaining({ shouldSend: expect.any(Function) }),
    );
  });

  it('captures exceptions with optional diagnostic context', () => {
    const error = new Error('boom');
    captureException(error, { component: 'board' });
    captureException(error);

    expect(sentry.captureException).toHaveBeenNthCalledWith(1, error, {
      extra: { component: 'board' },
    });
    expect(sentry.captureException).toHaveBeenNthCalledWith(2, error, undefined);
  });
});
