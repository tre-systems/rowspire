# Architecture

Rowspire is a static browser app. Gameplay, persistence, and AI all run client-side.

## Runtime Shape

```mermaid
flowchart LR
  Browser["Browser UI"] --> Store["Zustand + Immer store"]
  Store --> Logic["TypeScript game logic"]
  Logic --> Wasm["Rust/WebAssembly AI"]
  Wasm --> Search["Search AI"]
  Logic --> Worker["ML Web Worker"]
  Worker --> ML["ML AI + weights"]
  Store --> Storage["localStorage"]
```

## Frontend

- Next.js 15 static export with React 19 client components.
- Zustand stores own game and UI state.
- Immer keeps store updates concise without direct mutation.
- Runtime-validated domain types live in `src/lib/schemas.ts` and are re-exported through `src/lib/types.ts`.
- Brand identity lives in `src/lib/brand.ts` and feeds metadata, UI copy, and manifest generation.
- Procedural Web Audio effects live in `src/lib/sound-effects.ts`; move sounds run from the shared pending-move animation path so human and AI turns behave consistently.
- Animated background state lives in `src/lib/visuals/background-effects.ts`; rendering and entity creation are split into focused modules so long-running sessions keep respawning visible effects.

## Game State

`GameState` contains the board, current player, status, winner, move history, and winning line. Turn ownership rules live in `src/lib/game-state-machine.ts`. The store rejects duplicate input and uses a game generation token so delayed AI results cannot mutate a reset or replacement game.

The persisted store uses `rowspire-game-storage`. It validates and migrates the active game, mode, and AI selections before merging them into runtime state.

`AIType` is intentionally small: `search` or `ml`. `GameMode` controls human-vs-AI and AI-vs-AI flows.

## AI Boundary

- `src/lib/logic/ai-logic.ts` chooses the engine and owns tactical fallback behavior.
- `src/lib/wasm-ai-service.ts` loads `/wasm/rowspire_ai_core.js` on the main thread.
- `src/lib/ai.worker.ts` loads a separate WebAssembly instance for ML searches.
- `src/lib/ml-ai-worker-client.ts` validates worker responses, times out stalled requests, and recreates failed workers.
- Rust bindings are exported from `worker/src/wasm_api.rs` through the `RowspireAI` class.
- Shared TypeScript response types are generated into `src/lib/bindings.ts`.

Fallback order is primary engine, shallow Search AI, random valid column, then a user-visible error.

## Build Outputs

`npm run build:wasm-assets` creates ignored runtime assets:

- `public/wasm/rowspire_ai_core.js`
- `public/wasm/rowspire_ai_core_bg.wasm`
- `public/ml/data/...`

`npm run build` generates the service worker, builds those assets, exports the static site to `out/`, and runs the brand audit.

## Deployment

Wrangler serves `out/` with Workers Static Assets. There is no app server, server database, or server-side AI call.

## Diagrams

Source diagrams live in `docs/diagrams/*.dot`. Run `npm run diagrams` to render PNGs and `npm run check:diagrams` to verify generated diagram assets are current.

## Quality Gates

- `npm run lint`
- `npm run lint:rust`
- `npm run type-check`
- `npm run test:coverage`
- `npm run test:rust`
- `npm run test:e2e`
- `npm run brand:audit`
