import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3210',
    trace: 'on-first-retry',
    channel: 'chrome',
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3210',
    url: 'http://localhost:3210',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
