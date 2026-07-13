# AI System

Rowspire has two playable AI modes behind the `AIType` domain model: `search` and `ml`.

## Engines

| Engine           | Runtime                                      | Use                                  |
| ---------------- | -------------------------------------------- | ------------------------------------ |
| Search AI        | Rust bitboard solver compiled to WebAssembly | Fast tactical opponent and fallback  |
| ML AI            | Rust tactical guard, then neural MCTS        | Safe tactics and exploratory search  |
| Heuristic engine | Rust evaluation path                         | Internal support and experimentation |

The main thread owns the Search AI instance. The ML AI runs in `src/lib/ai.worker.ts` with its own WebAssembly instance and model weights so long searches do not block the UI. Its client validates responses, applies a timeout, and replaces a worker after failure.

## Model Assets

Source model files live under `resources/ai/`. The build copies them into:

- `public/ml/data/genetic_params/evolved.json`
- `public/ml/data/weights/ml_ai_weights_best.json`
- `public/ml/data/weights/ml_ai_weights_simple.json`

`npm run build:wasm-assets` compiles the Rust package and copies those assets.

## Move Flow

1. UI calls `makeAIMove(gameState, aiType)`.
2. `search` calls `getBestMove` at the configured search depth.
3. `ml` asks the ML worker, whose Rust engine takes immediate wins or blocks before running MCTS.
4. Invalid or failed AI responses fall back to a shallow Search AI move, then a random valid column.

## Training

The current ML model uses supervised teacher labels from the Rust solver and MCTS inference at runtime. Training entry points live in `worker/src/bin/`, with `npm run train` wrapping the Rust training binary.

`npm run train` uses `caffeinate` so macOS does not sleep mid-run.

## Troubleshooting

- Run `npm run build:wasm-assets` if `/wasm/rowspire_ai_core.js` is missing.
- Confirm model files exist under `public/ml/data/` after a build.
- Check the browser console for WebAssembly loading errors.
- Use `npm run test:wasm-loading` while the dev server is running.
