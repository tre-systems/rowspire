# Rowspire

Rowspire is an independent browser strategy game with Rust/WebAssembly AI opponents. It runs entirely client-side as a static Next.js 15 app on Cloudflare.

![Rowspire screenshot](screenshot.png)

## Features

- Two AI opponents compiled from Rust to WebAssembly:
  - Search AI: negamax with alpha-beta pruning over a compact bitboard engine.
  - ML AI: MCTS over value and policy networks.
- Human vs AI and AI vs AI watch mode.
- Procedural Web Audio effects for moves, wins, losses, and watch-mode AI turns.
- Persistent animated canvas background effects across setup, play, and completed games.
- Offline-first PWA with service worker caching.
- Responsive React 19 UI with Zustand, Immer, Tailwind, and Framer Motion.
- Brand audit that blocks legacy or third-party naming in source, docs, generated worker code, and exported pages.

## Quick Start

```bash
npm install
npm run build:wasm-assets
npm run dev
```

The dev server runs at [http://localhost:3000](http://localhost:3000). Requires Node 22+, Rust + Cargo, and `wasm-pack`.

## Commands

| Command               | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`         | Generate the service worker and start the dev server                                |
| `npm run build`       | Generate assets, export the static app, and run the brand audit                     |
| `npm run brand:audit` | Scan source, docs, generated public assets, and exported pages for blocked branding |
| `npm run check`       | Lint, type-check, Rust AI matrix test, coverage, brand audit, and Playwright        |
| `npm run test`        | Run Vitest unit tests                                                               |
| `npm run test:e2e`    | Run Playwright end-to-end tests                                                     |
| `npm run test:rust`   | Run Rust tests                                                                      |
| `npm run diagrams`    | Render architecture diagrams                                                        |
| `npm run deploy`      | Build and deploy the static site with Wrangler                                      |

## Architecture

- Frontend: Next.js 15 / React 19 with state in Zustand + Immer.
- AI: Rust in `worker/`, compiled to WebAssembly in `public/wasm/`.
- ML worker: `src/lib/ai.worker.ts` runs slow ML searches away from the main thread.
- Persistence: current game state in `localStorage` under `rowspire-game-storage`.
- Hosting: static export served by Cloudflare Workers Static Assets.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/AI-SYSTEM.md](docs/AI-SYSTEM.md).

## Branding

This project uses an original name and visual identity. Avoid using third-party board-game names, logos, packaging, rulebook text, or trade dress in the app, documentation, screenshots, metadata, or marketing copy.

Run `npm run brand:audit` before shipping brand-facing changes.

## Deployment

Pushing to `main` runs the deploy workflow. Wrangler provisions custom domains for `rowspire.com`, `rowspire.net`, `rowspire.org`, their `www` hosts, and `rowspire.tre.systems`.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design and diagrams
- [docs/AI-SYSTEM.md](docs/AI-SYSTEM.md): AI engines, model assets, and training notes
- [docs/BACKLOG.md](docs/BACKLOG.md): planned work
- [AGENTS.md](AGENTS.md): repo conventions

## License

[MIT](LICENSE)
