#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
backup=$(mktemp)
cp src/lib/bindings.ts "$backup"
restore() {
  cp "$backup" src/lib/bindings.ts
  rm -f "$backup"
}
trap restore EXIT

"$ROOT/scripts/generate-types.sh" >/dev/null
if ! cmp -s "$backup" src/lib/bindings.ts; then
  diff -u "$backup" src/lib/bindings.ts || true
  echo "Generated Rust bindings are stale. Run npm run generate:types."
  exit 1
fi
