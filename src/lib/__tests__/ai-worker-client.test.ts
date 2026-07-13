import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState, WasmBestMoveResponse, WasmMLResponse } from '../bindings';
import { AIWorkerClient } from '../ai-worker-client';

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

const state: GameState = {
  board: Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => 'empty' as const)),
  current_player: 'player1',
  genetic_params: {
    id: 'test',
    parent_ids: [],
    generation: 0,
    win_score: 10,
    loss_score: -10,
    center_column_value: 1,
    adjacent_center_value: 1,
    outer_column_value: 1,
    edge_column_value: 1,
    row_height_weight: 1,
    center_control_weight: 1,
    piece_count_weight: 1,
    threat_weight: 1,
    mobility_weight: 1,
    vertical_control_weight: 1,
    horizontal_control_weight: 1,
    defensive_weight: 1,
  },
};

const searchResponse: WasmBestMoveResponse = {
  move: 3,
  evaluations: [],
  nodesEvaluated: 10,
  transpositionHits: 2,
};

const mlResponse: WasmMLResponse = {
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

describe('AI worker client', () => {
  beforeEach(() => {
    FakeWorker.postError = null;
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('uses one worker for initialization, Search, and ML requests', async () => {
    const client = new AIWorkerClient();
    const initialization = client.initialize();
    FakeWorker.instance.emitMessage({ id: 1, type: 'initialize' });
    await initialization;

    const search = client.search(state, 5);
    FakeWorker.instance.emitMessage({ id: 2, type: 'search', response: searchResponse });
    await expect(search).resolves.toEqual(searchResponse);

    const ml = client.ml(state, 512);
    FakeWorker.instance.emitMessage({ id: 3, type: 'ml', response: mlResponse });
    await expect(ml).resolves.toEqual(mlResponse);

    expect(FakeWorker.instance.postMessage).toHaveBeenNthCalledWith(2, {
      id: 2,
      type: 'search',
      state,
      depth: 5,
    });
    expect(FakeWorker.instance.postMessage).toHaveBeenNthCalledWith(3, {
      id: 3,
      type: 'ml',
      state,
      simulations: 512,
    });
  });

  it('rejects every pending request after a malformed response', async () => {
    const client = new AIWorkerClient();
    const search = client.search(state, 5);
    const ml = client.ml(state, 32);
    const searchExpectation = expect(search).rejects.toThrow('invalid response');
    const mlExpectation = expect(ml).rejects.toThrow('invalid response');

    FakeWorker.instance.emitMessage({ id: 1, type: 'search', response: { move: 3 } });

    await Promise.all([searchExpectation, mlExpectation]);
    expect(FakeWorker.instance.terminate).toHaveBeenCalledOnce();
  });

  it('rejects mismatched response types as a fatal protocol error', async () => {
    const request = new AIWorkerClient().search(state, 5);
    const expectation = expect(request).rejects.toThrow('mismatched response');
    FakeWorker.instance.emitMessage({ id: 1, type: 'ml', response: mlResponse });

    await expectation;
  });

  it('rejects pending work when a response has no identifier', async () => {
    const request = new AIWorkerClient().search(state, 5);
    const expectation = expect(request).rejects.toThrow('invalid response');
    FakeWorker.instance.emitMessage({ type: 'search', response: searchResponse });

    await expectation;
  });

  it('terminates a failed worker and permits a fresh request', async () => {
    const client = new AIWorkerClient();
    const request = client.search(state, 5);
    const failedWorker = FakeWorker.instance;
    const expectation = expect(request).rejects.toThrow('worker crashed');
    failedWorker.emitError('worker crashed');

    await expectation;
    expect(failedWorker.terminate).toHaveBeenCalledOnce();

    const nextRequest = client.ml(state, 4_000);
    expect(FakeWorker.instance).not.toBe(failedWorker);
    FakeWorker.instance.emitMessage({ id: 2, type: 'ml', response: mlResponse });
    await expect(nextRequest).resolves.toEqual(mlResponse);
  });

  it('times out an unresponsive worker', async () => {
    vi.useFakeTimers();
    const request = new AIWorkerClient().search(state, 5);
    const expectation = expect(request).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(30_000);
    await expectation;
  });

  it('cleans up a request that cannot be posted', async () => {
    FakeWorker.postError = new Error('Cannot clone state');

    await expect(new AIWorkerClient().search(state, 5)).rejects.toThrow('Cannot clone state');
  });
});
