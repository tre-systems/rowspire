# Diagrams

The `.dot` files are the source of truth for complex diagrams; each renders to a same-named PNG committed for GitHub. Use inline Mermaid only when a compact relationship or state flow remains clear in Markdown source.

| Diagram                                | Question answered                      | Source                  |
| -------------------------------------- | -------------------------------------- | ----------------------- |
| System overview                        | What talks to what at runtime?         | `system-overview.dot`   |
| Build and deployment                   | How do sources become deployed assets? | `build-deploy-flow.dot` |
| AI move — strategy dispatch & fallback | How is one safe AI move selected?      | `ai-move-flow.dot`      |

## Conventions

- Green: application and Rust AI; purple: pure decisions; teal: persistence/deployment; blue: client; gold: build/generated assets; red: failure.
- Diamonds are decisions, bold green outlines are successful terminals, and dashed edges are provenance or exceptional flow.
- Clusters represent ownership or execution boundaries. Labels use a bold title and at most one short detail line.
- Every source requests Avenir, a white canvas, polyline routing, and common node/edge tokens. The renderer outputs 220-DPI PNGs.

`npm run check:diagrams` enforces shared style tokens and committed PNG presence. It also renders every source when Graphviz is available. `npm run diagrams` requires Graphviz and refreshes all PNGs; install it on macOS with `brew install graphviz`.
