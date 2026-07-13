# Diagrams

Graphviz/DOT sources plus rendered PNGs. The `.dot` files are the source of truth; PNGs are committed for GitHub viewing. This visual language follows the Antenna and swade-toolbox projects.

## Files

| Diagram                                | Question answered                      | Source                  | Rendered                |
| -------------------------------------- | -------------------------------------- | ----------------------- | ----------------------- |
| System overview                        | What talks to what at runtime?         | `system-overview.dot`   | `system-overview.png`   |
| Build and deployment                   | How do sources become deployed assets? | `build-deploy-flow.dot` | `build-deploy-flow.png` |
| AI move — strategy dispatch & fallback | How is one safe AI move selected?      | `ai-move-flow.dot`      | `ai-move-flow.png`      |

## Scope

Use inline Mermaid for a compact relationship or state view that remains readable in Markdown source. Use Graphviz for clustered architecture, branching workflows, exceptional paths, or edge routing. Each diagram answers one question; split a diagram when it mixes lifecycle phases or needs a second reading order.

## Conventions

Every DOT source uses the same graph, node, and edge defaults. `npm run check:diagrams` enforces the typography and core rendering tokens.

Color coding by domain:

- **Green** nodes / clusters — application code (React UI, Zustand stores, WASM facade, Rust AI engine).
- **Purple** — pure functions (`game-logic`, `logic/*`; no side effects).
- **Teal** — persistence and static deployment boundaries.
- **Blue** — client surface (browser / SPA).
- **Orange / gold** — build-time, generated assets, and codegen.
- **Diamonds** — decisions. **Bold green outline** — terminal success. **Bold red outline** — error / terminal failure.
- **Dashed** edges — provenance (compile / codegen) or exceptional control flow.

Fonts: Avenir. Rendered at 220 DPI.

Labels use a bold title and one short detail line. Clusters represent ownership or an execution boundary, never decoration. Solid edges are runtime or pipeline flow; dashed edges are generated provenance or exceptional control flow. Edge labels are short verbs.

## Render

```
npm run diagrams          # render all .dot files to PNG next to the source
npm run check:diagrams    # verify each .dot renders cleanly and the PNG exists
```

Both assume Graphviz is on PATH (`brew install graphviz`). On a machine without `dot`, `check:diagrams` skips with a clear message; refresh PNGs with `npm run diagrams` before committing diagram changes.

To render one manually:

```
dot -Tpng:cairo docs/diagrams/<name>.dot -Gdpi=220 -o docs/diagrams/<name>.png
```
