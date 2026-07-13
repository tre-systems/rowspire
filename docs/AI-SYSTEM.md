# AI System

Rowspire exposes two strategies through the closed `AIType` domain model.

| Strategy | Rust implementation                                 | Use                                     |
| -------- | --------------------------------------------------- | --------------------------------------- |
| Search   | Bitboard solver with negamax and alpha-beta pruning | Fast tactical opponent and fallback     |
| ML       | Immediate win/block guard followed by neural MCTS   | Exploratory search with tactical safety |

## Runtime

Both strategies run in `src/lib/ai.worker.ts`. The worker owns one WebAssembly instance, so search never blocks React and model/search lifecycle is consolidated.

The boundary is split deliberately:

- `ai-worker-protocol.ts` defines discriminated request and response contracts.
- `wasm-ai-boundary.ts` validates Rust transport state, model weights and engine results.
- `ai-worker-client.ts` correlates requests, applies timeouts and replaces failed workers.
- `wasm-ai-service.ts` converts browser domain state and caches genetic parameters.

## Assets

Source assets live under `resources/ai/`. The build stages exactly one copy of each runtime asset:

- `public/ml/data/genetic_params/evolved.json`
- `public/ml/data/weights/ml_ai_weights_best.json`

The service worker precaches the model and WebAssembly runtime for offline play.

## Move Flow

1. The command store requests a move through its injected AI port.
2. The service converts and validates the domain aggregate.
3. The client sends a discriminated Search or ML request to the worker.
4. The worker validates input, invokes Rust and validates output.
5. Invalid results fall back to shallow Search, then a seedable random legal move.
6. The store accepts the result only if its game generation and turn still match.

## Determinism and Conformance

Random sources are injectable in TypeScript and seedable in Rust, including neural initialization and MCTS. Tests use fixed seeds rather than ignored flaky assertions.

Shared conformance fixtures exercise legal moves, gravity, wins and draws in both TypeScript and Rust. This treats duplicated browser/Rust rules as an executable cross-runtime contract.

## Training

Training binaries and their `chrono`/`rayon` dependencies are feature-gated behind `training`. `npm run train` uses `caffeinate` so macOS cannot sleep during a run.

## Troubleshooting

- Run `npm run build:wasm-assets` if `/wasm/rowspire_ai_core.js` is missing.
- Confirm the two model assets exist under `public/ml/data/`.
- Check the worker error and browser console before retrying.
- Run `npm run test:wasm-loading` while the development server is running.
