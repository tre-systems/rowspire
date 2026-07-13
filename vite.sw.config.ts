import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { resolveBuildId } from './scripts/build-id.mjs';

export default defineConfig({
  publicDir: false,
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/service-worker.ts'),
      formats: ['es'],
      fileName: () => 'sw.js',
    },
    minify: true,
    outDir: 'public',
  },
  define: {
    __CACHE_VERSION__: JSON.stringify(resolveBuildId(process.env['GITHUB_SHA'])),
  },
});
