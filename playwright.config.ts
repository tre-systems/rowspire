import { defineConfig, devices } from '@playwright/test';

const e2ePort = 3100;
const baseURL = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
    command: `NODE_ENV=development PORT=${e2ePort} npm run dev`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
