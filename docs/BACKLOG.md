# Backlog

Known gaps and future work for Rowspire, ordered roughly by priority.

## Product / AI

- Difficulty levels: expose search depth presets so casual players can choose easier opponents.
- ML positioning: decide whether ML AI should remain a peer mode or move behind an experimental toggle.
- Heuristic path: either promote the heuristic engine into `AIType` or remove the unused public facade.

## Tech Debt

- Framework upgrade: migrate Next.js and its ESLint integration to version 16 after validating static export, Sentry, WebAssembly, and Node 26 without deprecation warnings.
- Rust file size: split oversized modules such as `lib.rs`, `solver.rs`, `mcts.rs`, `features.rs`, and `wasm_api.rs`.
- WASM boundary errors: replace stringly-typed failures with a discriminated result type.

## Quality

- CI on pull requests: add a non-deploying workflow for lint, type-check, unit tests, Rust tests, and Playwright.
- Generated metrics: prefer badges or generated summaries over hand-maintained coverage numbers.
- Brand safety: keep `npm run brand:audit` in local and CI gates.
