interface WASMAIInstance {
  get_ml_move: (state: unknown) => unknown;
  load_ml_weights: (value: unknown, policy: unknown) => void;
}

interface WASMModule {
  default: () => Promise<unknown>;
  RowspireAI: new () => WASMAIInstance;
}

const ctx = self as unknown as {
  onmessage: ((event: { data: { id: number; state: unknown } }) => void) | null;
  postMessage: (message: unknown) => void;
};

let aiPromise: Promise<WASMAIInstance> | null = null;

function loadAI(): Promise<WASMAIInstance> {
  if (!aiPromise) {
    aiPromise = (async () => {
      const wasm = (await import(
        /* webpackIgnore: true */ '/wasm/rowspire_ai_core.js'
      )) as WASMModule;
      await wasm.default();
      const ai = new wasm.RowspireAI();

      try {
        const res = await fetch('/ml/data/weights/ml_ai_weights_best.json');
        if (res.ok) {
          const model = (await res.json()) as {
            value_network?: { weights: number[] };
            policy_network?: { weights: number[] };
          };
          if (model.value_network?.weights && model.policy_network?.weights) {
            ai.load_ml_weights(model.value_network.weights, model.policy_network.weights);
          }
        }
      } catch (error) {
        console.warn('ML weights unavailable; using default initialization:', error);
      }

      return ai;
    })();
  }
  return aiPromise;
}

ctx.onmessage = async event => {
  const { id, state } = event.data;
  try {
    const ai = await loadAI();
    ctx.postMessage({ id, response: ai.get_ml_move(state) });
  } catch (error) {
    ctx.postMessage({ id, error: String(error) });
  }
};
