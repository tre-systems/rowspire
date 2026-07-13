import type { GameState, WasmBestMoveResponse, WasmMLResponse } from './bindings';
import {
  AIWorkerResponseSchema,
  workerMessageId,
  type AIWorkerRequest,
  type AIWorkerResponse,
} from './ai-worker-protocol';

const REQUEST_TIMEOUT_MS = 30_000;

type PendingRequest = {
  type: AIWorkerRequest['type'];
  resolve: (response: AIWorkerResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type WithoutId<T> = T extends { id: number } ? Omit<T, 'id'> : never;
type WorkerCommand = WithoutId<AIWorkerRequest>;

export class AIWorkerClient {
  private worker: Worker | null = null;
  private requestId = 0;
  private readonly pending = new Map<number, PendingRequest>();

  async initialize(): Promise<void> {
    await this.request({ type: 'initialize' });
  }

  async search(state: GameState, depth: number): Promise<WasmBestMoveResponse> {
    const result = await this.request({ type: 'search', state, depth });
    if ('response' in result && result.type === 'search') return result.response;
    throw new Error('AI worker returned an unexpected search response');
  }

  async ml(state: GameState): Promise<WasmMLResponse> {
    const result = await this.request({ type: 'ml', state });
    if ('response' in result && result.type === 'ml') return result.response;
    throw new Error('AI worker returned an unexpected ML response');
  }

  private request(command: WorkerCommand): Promise<AIWorkerResponse> {
    const id = ++this.requestId;
    const worker = this.getWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.failAll(new Error('AI worker timed out'));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, { type: command.type, resolve, reject, timeout });
      try {
        worker.postMessage({ id, ...command } satisfies AIWorkerRequest);
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
      this.failAll(new Error(`AI worker error: ${event.message}`));
    });
    return this.worker;
  }

  private handleMessage(event: MessageEvent<unknown>) {
    const id = workerMessageId(event.data);
    if (id === null) {
      if (this.pending.size > 0) this.failAll(new Error('AI worker returned an invalid response'));
      return;
    }
    const request = this.pending.get(id);
    if (!request) {
      if (this.pending.size > 0) this.failAll(new Error('AI worker returned an unknown response'));
      return;
    }

    const message = AIWorkerResponseSchema.safeParse(event.data);
    if (!message.success) {
      this.failAll(new Error('AI worker returned an invalid response'));
      return;
    }

    if ('error' in message.data) {
      clearTimeout(request.timeout);
      this.pending.delete(id);
      request.reject(new Error(message.data.error));
      return;
    }
    if (message.data.type !== request.type) {
      this.failAll(new Error('AI worker returned a mismatched response'));
      return;
    }

    clearTimeout(request.timeout);
    this.pending.delete(id);
    request.resolve(message.data);
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
