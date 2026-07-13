#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const roots = [
  'src',
  'public',
  'out',
  'docs',
  'e2e',
  'scripts',
  '.github',
  'worker/Cargo.toml',
  'worker/src',
  'worker/tests',
  'README.md',
  'package.json',
  'package-lock.json',
  'wrangler.toml',
  'vite.config.ts',
  'playwright.config.ts',
  'env.d.ts',
];

const skipDirs = new Set([
  '.git',
  '.wrangler',
  'coverage',
  'node_modules',
  'playwright-report',
  'test-results',
  'target',
]);

const binaryExtensions = new Set([
  '.bin',
  '.br',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mov',
  '.mp4',
  '.onnx',
  '.pdf',
  '.png',
  '.psd',
  '.pt',
  '.pth',
  '.safetensors',
  '.wasm',
  '.webp',
  '.zip',
]);

const bannedTerms = [
  { label: 'legacy numeric game name', pattern: ['connect', '\\s*', '4'].join('') },
  { label: 'legacy word game name', pattern: ['connect', '[-_\\s]*', 'four'].join('') },
  { label: 'legacy compact component name', pattern: ['connect', '\\s*', 'four'].join('') },
  { label: 'legacy hyphenated host name', pattern: ['connect', '-', '4'].join('') },
  { label: 'third-party publisher', pattern: 'hasbro' },
  { label: 'third-party publisher', pattern: ['milton', '\\s+', 'bradley'].join('') },
  { label: 'third-party publisher', pattern: ['mb', '\\s+', 'games'].join('') },
  { label: 'third-party product mode', pattern: ['pop', '\\s*', 'out'].join('') },
  { label: 'legacy AI label', pattern: ['cla', 'ssic', '\\s+', 'ai'].join('') },
  { label: 'legacy engine label', pattern: ['cla', 'ssic', '\\s+', 'engine'].join('') },
  { label: 'official-product wording', pattern: ['official', '\\s+', 'game'].join('') },
  {
    label: 'legacy marketing wording',
    pattern: ['cla', 'ssic', '\\s+', 'board', '\\s+', 'game'].join(''),
  },
].map(term => ({
  ...term,
  regex: new RegExp(term.pattern, 'i'),
}));

const allowedInfrastructureReferences = [
  {
    file: 'wrangler.toml',
    text: 'connect-4.tre.systems',
  },
  {
    file: 'src/lib/canonical-host.ts',
    text: 'connect-4.tre.systems',
  },
  {
    file: 'src/lib/__tests__/canonical-host.test.ts',
    text: 'connect-4.tre.systems',
  },
  {
    file: 'out/rowspire_main/index.js',
    text: 'connect-4.tre.systems',
  },
  {
    file: 'out/rowspire_main/index.js.map',
    text: 'connect-4.tre.systems',
  },
  {
    file: 'out/rowspire_main/wrangler.json',
    text: 'connect-4.tre.systems',
  },
];

function shouldSkip(path) {
  const parts = path.split('/');
  return parts.some(part => skipDirs.has(part)) || binaryExtensions.has(extname(path));
}

function listFiles(path) {
  if (!existsSync(path) || shouldSkip(path)) return [];

  const stat = lstatSync(path);
  if (stat.isFile()) return [path];
  if (!stat.isDirectory()) return [];

  return readdirSync(path).flatMap(entry => listFiles(join(path, entry)));
}

function findMatches(file) {
  if (relative(process.cwd(), file) === 'scripts/check-branding.mjs') return [];

  const relativeFile = relative(process.cwd(), file);
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    for (const term of bannedTerms) {
      if (term.regex.test(line)) {
        const isAllowedInfrastructureReference = allowedInfrastructureReferences.some(
          reference => reference.file === relativeFile && line.includes(reference.text),
        );

        if (isAllowedInfrastructureReference) {
          continue;
        }

        matches.push({
          file: relativeFile,
          line: index + 1,
          label: term.label,
          snippet: line.trim(),
        });
      }
    }
  });

  return matches;
}

const matches = roots.flatMap(root => listFiles(root)).flatMap(findMatches);

if (matches.length > 0) {
  console.error('Brand audit failed. Remove legacy or third-party branding:');
  for (const match of matches) {
    console.error(`${match.file}:${match.line} [${match.label}] ${match.snippet}`);
  }
  process.exit(1);
}

console.log('Brand audit passed.');
