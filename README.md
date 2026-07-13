# Rowspire

Rowspire is an independent browser strategy game with two Rust/WebAssembly AI opponents. The React application runs entirely in the browser and is delivered through Cloudflare Workers Static Assets. Anonymous product metrics count only games started and completed; no board, move, browser, or user identifiers are collected.

[Play Rowspire](https://rowspire.com)

![Rowspire opponent selection](screenshot.png)

## Capabilities

- Tactical Search and neural MCTS strategies run off the main thread in one Web Worker.
- Relaxed, Standard, and Expert levels tune both opponents for newcomers and experienced players.
- Human-versus-AI play and a Search-versus-ML watch mode.
- Responsive, accessible animation with reduced-motion support.
- Validated local persistence and offline recovery after service-worker activation.
- Cross-runtime conformance plus unit, AI, and browser release gates.

## Development

Requires Node.js 22.12 or later, a Rust toolchain, `cargo-audit` 0.22.2, `wasm-pack` 0.15.0, and `wasm-bindgen-cli` 0.2.122. Graphviz is required to refresh architecture diagrams.

```bash
npm ci
npm run dev
```

The development server is available at [http://localhost:5173](http://localhost:5173).

## Commands

| Command                      | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`                | Build WASM/PWA assets and start the Cloudflare Vite development server        |
| `npm run build`              | Lint, type-check, audit, and create the deployable Worker/static-asset output |
| `npm run check`              | Run the complete release gate, including tests and production-preview E2E     |
| `npm run check:slow`         | Add the feature-gated slow Rust tests to the release gate                     |
| `npm run test`               | Run Vitest unit tests                                                         |
| `npm run test:coverage`      | Run Vitest with enforced coverage thresholds                                  |
| `npm run test:rust`          | Run Rust tests for every target and feature                                   |
| `npm run test:e2e`           | Build and run Playwright against the production preview                       |
| `npm run generate:types`     | Regenerate TypeScript transport types from Rust                               |
| `npm run check:types`        | Reject drift between Rust exports and committed TypeScript bindings           |
| `npm run audit:dependencies` | Check npm advisories/signatures and the RustSec advisory database             |
| `npm run diagrams`           | Render the Graphviz architecture diagrams                                     |
| `npm run train`              | Generate/load training data, train under `caffeinate`, and replace ML weights |
| `npm run deploy`             | Build and deploy with Wrangler                                                |
| `npm run smoke:production`   | Verify the live shell, manifest, WASM, ML weights, and canonical redirect     |

## Documentation

| Document                                 | Scope                                                         |
| ---------------------------------------- | ------------------------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)     | Patterns, boundaries, ownership, AI, delivery, and safeguards |
| [Diagram guide](docs/diagrams/README.md) | Graphviz/Mermaid scope, visual conventions, and rendering     |
| [Contributor instructions](AGENTS.md)    | Coding, testing, and maintenance rules                        |
| [Security policy](SECURITY.md)           | Supported code and private vulnerability reporting            |

## Delivery

Every pull request runs the release gate and CodeQL. Every push to `main` repeats validation, deploys the tested output to Cloudflare, and smoke-tests production. Actions and toolchains are immutable; production credentials are exposed only to the build or deployment step that needs them.

## License

[MIT](LICENSE)
