#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

const documents = ['README.md', 'AGENTS.md', 'SECURITY.md', ...markdownFiles('docs')];
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};
const failures = [];

for (const document of documents) {
  const source = readFileSync(document, 'utf8');

  for (const match of source.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1]?.replace(/^<|>$/g, '');
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;

    const file = decodeURIComponent(target.split('#')[0] ?? '');
    if (file && !existsSync(resolve(dirname(document), file))) {
      failures.push(`${document}: missing link target ${target}`);
    }
  }

  for (const match of source.matchAll(/npm run ([\w:-]+)/g)) {
    const command = match[1];
    if (command && !(command in scripts)) {
      failures.push(`${document}: unknown npm command ${command}`);
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation check failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Documentation check passed (${documents.length} Markdown files).`);
