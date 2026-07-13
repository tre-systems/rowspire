import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WasmMLResponse } from '../bindings';
import { MLAIWorkerClient } from '../ml-ai-worker-client';

class FakeWorker {
  static instance: FakeWorker;
  static postError: Error | null = null;

  readonly postMessage = vi.fn(() => {
    if (FakeWorker.postError) throw FakeWorker.postError;
  });
  readonly terminate = vi.fn();
  private readonly listeners = new Map<string, (event: Event) => void>();

  constructor() {
    FakeWorker.instance = this;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback =
      typeof listener === 'function' ? listener : (event: Event) => listener.handleEvent(event);
    this.listeners.set(type, callback);
  }

  emitMessage(data: unknown) {
    this.listeners.get('message')?.(new MessageEvent('message', { data }));
  }

  emitError(message: string) {
    this.listeners.get('error')?.(new ErrorEvent('error', { message }));
  }
}

const response: WasmMLResponse = {
  move: 3,
  evaluation: 0.5,
  thinking: 'Test move',
  diagnostics: {
    validMoves: [3],
    moveEvaluations: [],
    valueNetworkOutput: 0.5,
    policyNetworkOutputs: [0, 0, 0, 1, 0, 0, 0],
  },
};

describe('ML AI worker client', () => {
  beforeEach(() => {
    FakeWorker.postError = null;
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolves validated worker responses', async () => {
    const request = new MLAIWorkerClient().request({ board: [] });
    FakeWorker.instance.emitMessage({ id: 1, response });

    await expect(request).resolves.toEqual(response);
    expect(FakeWorker.instance.postMessage).toHaveBeenCalledWith({ id: 1, state: { board: [] } });
  });

  it('rejects malformed worker responses', async () => {
    const request = new MLAIWorkerClient().request({});
    const expectation = expect(request).rejects.toThrow('invalid response');
    FakeWorker.instance.emitMessage({ id: 1, response: { move: 3 } });

    await expectation;
    expect(FakeWorker.instance.terminate).toHaveBeenCalledOnce();
  });

  it('terminates a failed worker and permits a fresh request', async () => {
    const client = new MLAIWorkerClient();
    const request = client.request({});
    const failedWorker = FakeWorker.instance;
    const expectation = expect(request).rejects.toThrow('worker crashed');
    failedWorker.emitError('worker crashed');

    await expectation;
    expect(failedWorker.terminate).toHaveBeenCalledOnce();

    const nextRequest = client.request({});
    expect(FakeWorker.instance).not.toBe(failedWorker);
    FakeWorker.instance.emitMessage({ id: 2, response });
    await expect(nextRequest).resolves.toEqual(response);
  });

  it('times out an unresponsive worker', async () => {
    vi.useFakeTimers();
    const request = new MLAIWorkerClient().request({});
    const expectation = expect(request).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(30_000);
    await expectation;
  });

  it('cleans up a request that cannot be posted', async () => {
    FakeWorker.postError = new Error('Cannot clone state');

    await expect(new MLAIWorkerClient().request({})).rejects.toThrow('Cannot clone state');
  });
});
