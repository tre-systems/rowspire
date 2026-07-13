import {
  AIWorkerRequestSchema,
  type AIWorkerResponse,
  workerMessageId,
} from './ai-worker-protocol';
import {
  BestMoveResponseSchema,
  MLResponseSchema,
  MLWeightsSchema,
  type WASMAIInstance,
  type WASMModule,
} from './wasm-ai-boundary';

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: AIWorkerResponse) => void;
};

let aiPromise: Promise<WASMAIInstance> | null = null;

function loadAI(): Promise<WASMAIInstance> {
  if (!aiPromise) {
    aiPromise = initializeAI().catch(error => {
      aiPromise = null;
      throw error;
    });
  }
  return aiPromise;
}

async function initializeAI(): Promise<WASMAIInstance> {
  const modulePath = '/wasm/rowspire_ai_core.js';
  const wasm = (await import(/* @vite-ignore */ modulePath)) as WASMModule;
  await wasm.default();
  const ai = new wasm.RowspireAI();

  try {
    const res = await fetch('/ml/data/weights/ml_ai_weights_best.json');
    if (!res.ok) throw new Error(`ML weights request failed with status ${res.status}`);

    const model = MLWeightsSchema.parse(await res.json());
    ai.load_ml_weights(model.value_network.weights, model.policy_network.weights);
  } catch (error) {
    console.warn('ML weights unavailable; using default initialization:', error);
  }

  return ai;
}

ctx.onmessage = async event => {
  const request = AIWorkerRequestSchema.safeParse(event.data);
  if (!request.success) {
    const id = workerMessageId(event.data);
    if (id !== null) ctx.postMessage({ id, error: 'AI worker received an invalid request' });
    return;
  }

  const { id } = request.data;
  try {
    const ai = await loadAI();
    if (request.data.type === 'initialize') {
      ctx.postMessage({ id, type: 'initialize' });
      return;
    }
    if (request.data.type === 'search') {
      ai.clear_transposition_table();
      const response = BestMoveResponseSchema.parse(
        ai.get_best_move(request.data.state, request.data.depth),
      );
      ctx.postMessage({ id, type: 'search', response });
      return;
    }
    const response = MLResponseSchema.parse(ai.get_ml_move(request.data.state));
    ctx.postMessage({ id, type: 'ml', response });
  } catch (error) {
    ctx.postMessage({ id, error: String(error) });
  }
};
