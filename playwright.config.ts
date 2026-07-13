import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env['PLAYWRIGHT_PORT'] ?? 3100);
const baseURL = `http://localhost:${e2ePort}`;
const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${e2ePort}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
