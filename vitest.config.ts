import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/lib/__tests__/setup.ts'],
    globals: true,
    css: false,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: ['src/lib/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/lib/__tests__/**', 'src/lib/bindings.ts', 'src/lib/types.ts'],
      include: ['src/lib/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '/wasm': resolve(__dirname, './public/wasm'),
    },
  },
});
