import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const budgets = new Map([
  ['.js', 450_000],
  ['.css', 60_000],
  ['.wasm', 100_000],
  ['.json', 1_300_000],
]);

function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const target = join(path, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}

const totals = new Map();
for (const file of files('out/client')) {
  const extension = extname(file);
  if (!budgets.has(extension) || !statSync(file).isFile()) continue;
  const compressed = gzipSync(readFileSync(file)).byteLength;
  totals.set(extension, (totals.get(extension) ?? 0) + compressed);
}

let failed = false;
for (const [extension, budget] of budgets) {
  const total = totals.get(extension) ?? 0;
  console.log(`${extension}: ${total.toLocaleString()} / ${budget.toLocaleString()} gzip bytes`);
  if (total > budget) failed = true;
}

if (failed) throw new Error(`Bundle budget exceeded in ${relative(process.cwd(), 'out/client')}`);
