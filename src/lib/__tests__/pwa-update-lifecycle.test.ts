import { describe, expect, it, vi } from 'vitest';
import {
  activateWaitingServiceWorker,
  checkForServiceWorkerUpdate,
  installUpdateCheckTriggers,
  shouldRunUpdateCheck,
} from '../pwa-update-lifecycle';

class FakeWorker extends EventTarget {
  messages: unknown[] = [];
  state: ServiceWorkerState = 'installed';

  postMessage(message: unknown) {
    this.messages.push(message);
  }
}

function registrationWith(
  overrides: Partial<ServiceWorkerRegistration> = {},
): ServiceWorkerRegistration {
  return {
    installing: null,
    waiting: null,
    update: vi.fn(async function (this: ServiceWorkerRegistration) {
      return this;
    }),
    ...overrides,
  } as unknown as ServiceWorkerRegistration;
}

describe('PWA update lifecycle', () => {
  it('debounces clustered foreground checks', () => {
    expect(shouldRunUpdateCheck(10_000, 0)).toBe(true);
    expect(shouldRunUpdateCheck(65_000, 10_000)).toBe(false);
    expect(shouldRunUpdateCheck(70_000, 10_000)).toBe(true);
  });

  it('checks the worker without cache before updating', async () => {
    const registration = registrationWith();
    const fetcher = vi.fn(
      async () =>
        new Response('worker', {
          status: 200,
          headers: { 'content-type': 'text/javascript' },
        }),
    );

    await expect(
      checkForServiceWorkerUpdate({
        registration,
        swUrl: '/sw.js',
        fetcher: fetcher as typeof fetch,
      }),
    ).resolves.toBe('current');
    expect(fetcher).toHaveBeenCalledWith('/sw.js', {
      cache: 'no-store',
      headers: { cache: 'no-store', 'cache-control': 'no-cache' },
    });
    expect(registration.update).toHaveBeenCalledOnce();
  });

  it('returns existing lifecycle states without another fetch', async () => {
    const fetcher = vi.fn();
    const waiting = new FakeWorker() as unknown as ServiceWorker;
    const installing = new FakeWorker() as unknown as ServiceWorker;

    await expect(
      checkForServiceWorkerUpdate({
        registration: registrationWith({ waiting }),
        swUrl: '/sw.js',
        fetcher: fetcher as typeof fetch,
      }),
    ).resolves.toBe('waiting');
    await expect(
      checkForServiceWorkerUpdate({
        registration: registrationWith({ installing }),
        swUrl: '/sw.js',
        fetcher: fetcher as typeof fetch,
      }),
    ).resolves.toBe('installing');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('checks on visible lifecycle events and cleans up', () => {
    vi.useFakeTimers();
    const windowTarget = new EventTarget();
    const documentTarget = new EventTarget();
    const check = vi.fn();
    let visible = true;
    const cleanup = installUpdateCheckTriggers({
      check,
      documentTarget,
      intervalMs: 1_000,
      isVisible: () => visible,
      setIntervalFn: setInterval as unknown as typeof window.setInterval,
      clearIntervalFn: clearInterval as unknown as typeof window.clearInterval,
      windowTarget,
    });

    documentTarget.dispatchEvent(new Event('visibilitychange'));
    windowTarget.dispatchEvent(new Event('focus'));
    windowTarget.dispatchEvent(new Event('online'));
    windowTarget.dispatchEvent(new Event('pageshow'));
    vi.advanceTimersByTime(1_000);
    expect(check).toHaveBeenCalledTimes(5);

    visible = false;
    windowTarget.dispatchEvent(new Event('focus'));
    vi.advanceTimersByTime(1_000);
    expect(check).toHaveBeenCalledTimes(5);

    cleanup();
    visible = true;
    windowTarget.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(1_000);
    expect(check).toHaveBeenCalledTimes(5);
    vi.useRealTimers();
  });

  it('activates the exact worker and reloads', async () => {
    const waiting = new FakeWorker();
    const reload = vi.fn();
    const activation = activateWaitingServiceWorker({
      registration: registrationWith({ waiting: waiting as unknown as ServiceWorker }),
      reload,
    });

    expect(waiting.messages).toEqual([{ type: 'SKIP_WAITING' }]);
    waiting.state = 'activated';
    waiting.dispatchEvent(new Event('statechange'));
    await expect(activation).resolves.toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('uses a bounded fallback when WebKit misses lifecycle delivery', async () => {
    vi.useFakeTimers();
    const waiting = new FakeWorker();
    const reload = vi.fn();
    const activation = activateWaitingServiceWorker({
      registration: registrationWith({ waiting: waiting as unknown as ServiceWorker }),
      reload,
      fallbackMs: 2_000,
      setTimeoutFn: setTimeout as unknown as typeof window.setTimeout,
      clearTimeoutFn: clearTimeout as unknown as typeof window.clearTimeout,
    });

    await vi.advanceTimersByTimeAsync(2_000);
    await expect(activation).resolves.toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
