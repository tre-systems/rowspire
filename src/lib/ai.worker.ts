import {
  MLResponseSchema,
  MLWorkerRequestSchema,
  type MLWorkerResponse,
} from './ml-ai-worker-protocol';

interface WASMAIInstance {
  get_ml_move: (state: unknown) => unknown;
  load_ml_weights: (value: unknown, policy: unknown) => void;
}

interface WASMModule {
  default: () => Promise<unknown>;
  RowspireAI: new () => WASMAIInstance;
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: MLWorkerResponse) => void;
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
  const wasm = (await import(/* webpackIgnore: true */ '/wasm/rowspire_ai_core.js')) as WASMModule;
  await wasm.default();
  const ai = new wasm.RowspireAI();

  try {
    const res = await fetch('/ml/data/weights/ml_ai_weights_best.json');
    if (!res.ok) throw new Error(`ML weights request failed with status ${res.status}`);

    const model = (await res.json()) as {
      value_network?: { weights: number[] };
      policy_network?: { weights: number[] };
    };
    if (model.value_network?.weights && model.policy_network?.weights) {
      ai.load_ml_weights(model.value_network.weights, model.policy_network.weights);
    }
  } catch (error) {
    console.warn('ML weights unavailable; using default initialization:', error);
  }

  return ai;
}

ctx.onmessage = async event => {
  const request = MLWorkerRequestSchema.safeParse(event.data);
  if (!request.success) {
    console.error('ML worker received an invalid request');
    return;
  }

  const { id, state } = request.data;
  try {
    const ai = await loadAI();
    const response = MLResponseSchema.parse(ai.get_ml_move(state));
    ctx.postMessage({ id, response });
  } catch (error) {
    ctx.postMessage({ id, error: String(error) });
  }
};
