# Project Instructions

## Design

- Prefer the simplest concise, elegant implementation that handles errors well.
- Keep domain schemas and types consolidated; avoid duplicated types and strengthen type checking when practical.
- Use Zustand for React state and Immer for TypeScript state updates.
- Keep the state machine consolidated and easy to understand.
- Put testable decisions in `src/lib`; keep UI components focused on rendering and events.
- Review whether each file has one appropriate responsibility. Prefer code files under 200 lines and functions under 20 lines.
- Prefer Rust where practical; use Python only when necessary.

## Code Quality

- Never suppress lint rules, warnings, or errors. Fix their causes and strengthen useful rules.
- Avoid mutation, duplication, unnecessary comments, and logging noise.
- Keep only comments that explain an important non-obvious constraint.
- Use the console directly; do not add a logging framework.
- Use blank lines to make code structure clear.
- Handle errors clearly without elaborate defensive machinery.

## Tests

- Use Vitest for unit tests and Playwright for end-to-end tests.
- Do not unit-test UI components. Extract their logic into `src/lib` and unit-test it there.
- Add stable `data-testid` attributes to UI components for Playwright.
- Keep coverage high and integrate useful temporary tests into the permanent suite.

## Maintenance

- Keep `README.md` and `docs/` concise, current, and free of duplication.
- Keep `.gitignore` and `.cursorignore` current; exclude generated artifacts and large model files from indexing.
- Run training and other long-running commands under `caffeinate`.
- Make and execute the best plan instead of presenting avoidable choices.
- Use [rgou-cloudflare](https://github.com/tre-systems/rgou-cloudflare) as a working-game reference when useful.
