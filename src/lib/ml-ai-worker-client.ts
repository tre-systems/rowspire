import type { WasmMLResponse } from './bindings';
import {
  MLWorkerResponseSchema,
  workerMessageId,
  type MLWorkerRequest,
} from './ml-ai-worker-protocol';

const REQUEST_TIMEOUT_MS = 30_000;

type PendingRequest = {
  resolve: (response: WasmMLResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

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
        worker.postMessage({ id, state } satisfies MLWorkerRequest);
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

  private handleMessage(event: MessageEvent<unknown>) {
    const id = workerMessageId(event.data);
    if (id === null) return;
    const request = this.pending.get(id);
    if (!request) return;

    clearTimeout(request.timeout);
    this.pending.delete(id);

    const message = MLWorkerResponseSchema.safeParse(event.data);
    if (!message.success) {
      request.reject(new Error('ML worker returned an invalid response'));
      this.worker?.terminate();
      this.worker = null;
      return;
    }

    if ('error' in message.data) request.reject(new Error(message.data.error));
    else request.resolve(message.data.response);
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
