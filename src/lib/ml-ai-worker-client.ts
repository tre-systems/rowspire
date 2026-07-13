import type { WasmMLResponse } from './bindings';

const REQUEST_TIMEOUT_MS = 30_000;

type PendingRequest = {
  resolve: (response: WasmMLResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type WorkerResponse = {
  id?: unknown;
  response?: unknown;
  error?: unknown;
};

function isMLResponse(value: unknown): value is WasmMLResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  const move = response.move;
  const diagnostics = response.diagnostics;
  if (!diagnostics || typeof diagnostics !== 'object') return false;

  const details = diagnostics as Record<string, unknown>;
  return (
    (move === null || (Number.isInteger(move) && Number(move) >= 0 && Number(move) < 7)) &&
    typeof response.evaluation === 'number' &&
    Number.isFinite(response.evaluation) &&
    typeof response.thinking === 'string' &&
    Array.isArray(details.validMoves) &&
    Array.isArray(details.moveEvaluations) &&
    typeof details.valueNetworkOutput === 'number' &&
    Array.isArray(details.policyNetworkOutputs)
  );
}

export class MLAIWorkerClient {
  private worker: Worker | null = null;
  private requestId = 0;
  private readonly pending = new Map<number, PendingRequest>();

  request(state: unknown): Promise<WasmMLResponse> {
    const id = ++this.requestId;
    const worker = this.getWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.failAll(new Error('ML worker timed out'));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timeout });
      try {
        worker.postMessage({ id, state });
      } catch (error) {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;

    this.worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', event => this.handleMessage(event));
    this.worker.addEventListener('error', event => {
      this.failAll(new Error(`ML worker error: ${event.message}`));
    });
    return this.worker;
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, response, error } = event.data;
    if (typeof id !== 'number') return;

    const request = this.pending.get(id);
    if (!request) return;

    clearTimeout(request.timeout);
    this.pending.delete(id);

    if (typeof error === 'string') request.reject(new Error(error));
    else if (isMLResponse(response)) request.resolve(response);
    else {
      request.reject(new Error('ML worker returned an invalid response'));
      this.worker?.terminate();
      this.worker = null;
    }
  }

  private failAll(error: Error) {
    this.pending.forEach(request => {
      clearTimeout(request.timeout);
      request.reject(error);
    });
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}
