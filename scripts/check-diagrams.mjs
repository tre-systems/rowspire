#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoRoot = process.cwd();
const diagramDir = join(repoRoot, 'docs', 'diagrams');

const dotFiles = readdirSync(diagramDir)
  .filter(file => file.endsWith('.dot'))
  .sort();

if (dotFiles.length === 0) {
  console.error('No .dot files found in docs/diagrams.');
  process.exit(1);
}

const failures = [];

const requiredStyle = [
  ['white canvas', 'bgcolor="#ffffff"'],
  ['edge-first rendering', 'outputorder=edgesfirst'],
  ['polyline routing', 'splines=polyline'],
  ['Avenir typography', 'fontname="Avenir"'],
  ['34-point title', 'POINT-SIZE="34"'],
  ['rounded nodes', 'style="rounded,filled"'],
  ['standard node border', 'penwidth=2.4'],
  ['vertical node gradient', 'gradientangle=270'],
  ['navy text', 'fontcolor="#14213d"'],
  ['navy edges', 'color="#263a59"'],
  ['standard edge width', 'penwidth=2.2'],
  ['standard arrow size', 'arrowsize=0.78'],
];

function validateStyle(file, source) {
  for (const [name, token] of requiredStyle) {
    if (!source.includes(token)) failures.push(`${file}: missing ${name} (${token})`);
  }
}

function reportFailures() {
  if (failures.length === 0) return;

  console.error('Diagram check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nRender locally with: npm run diagrams');
  process.exit(1);
}

for (const file of dotFiles) {
  const source = join(diagramDir, file);
  if (!existsSync(source.replace(/\.dot$/, '.png'))) {
    failures.push(`${file}: missing committed PNG next to .dot source`);
  }

  validateStyle(file, readFileSync(source, 'utf8'));
}

reportFailures();

const probe = spawnSync('dot', ['-V'], { stdio: 'ignore' });
if (probe.error || probe.status !== 0) {
  console.log(
    `Diagram style passed (${dotFiles.length} diagrams); render skipped without Graphviz.`,
  );
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), 'rowspire-diagrams-'));

try {
  for (const file of dotFiles) {
    const source = join(diagramDir, file);
    const renderedPng = join(tempDir, file.replace(/\.dot$/, '.png'));

    const result = spawnSync('dot', ['-Tpng:cairo', source, '-Gdpi=220', '-o', renderedPng], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error) {
      failures.push(`${file}: could not run Graphviz dot (${result.error.message})`);
      continue;
    }
    if (result.status !== 0) {
      failures.push(`${file}: dot exited ${result.status}\n${result.stderr.trim()}`);
      continue;
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

reportFailures();

console.log(`Diagram check passed (${dotFiles.length} diagrams render cleanly).`);
