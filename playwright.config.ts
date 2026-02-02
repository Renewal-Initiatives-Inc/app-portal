import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'html' : 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Safari only in CI to speed up local dev
    ...(isCI
      ? [
          {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
          },
        ]
      : []),
  ],
  // Only start webServer in CI; locally, start `npm run dev` yourself
  ...(isCI
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:3000',
          timeout: 60000,
        },
      }
    : {}),
});
