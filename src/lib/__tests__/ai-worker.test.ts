import { afterEach, describe, expect, it, vi } from 'vitest';

describe('AI worker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('immediately responds to invalid requests with recoverable identifiers', async () => {
    const postMessage = vi.fn();
    const workerScope = { onmessage: null, postMessage };
    vi.stubGlobal('self', workerScope);
    await import('../ai.worker');

    const onmessage = workerScope.onmessage as unknown as (
      event: MessageEvent<unknown>,
    ) => Promise<void>;
    await onmessage(new MessageEvent('message', { data: { id: 7, type: 'ml', state: {} } }));

    expect(postMessage).toHaveBeenCalledWith({
      id: 7,
      error: 'AI worker received an invalid request',
    });
  });

  it('does not respond when an invalid request has no usable identifier', async () => {
    const postMessage = vi.fn();
    const workerScope = { onmessage: null, postMessage };
    vi.stubGlobal('self', workerScope);
    await import('../ai.worker');

    const onmessage = workerScope.onmessage as unknown as (
      event: MessageEvent<unknown>,
    ) => Promise<void>;
    await onmessage(new MessageEvent('message', { data: { type: 'ml', state: {} } }));

    expect(postMessage).not.toHaveBeenCalled();
  });
});
