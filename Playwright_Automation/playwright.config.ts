import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';

loadEnv({ quiet: true });

const baseUrl = process.env.BASE_URL ?? 'https://qaplayground.com';
const isCI = !!process.env.CI;

export default defineConfig({
  // Test discovery
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // Runtime settings
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,

  // Reporters
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],

  // Shared browser context options
  use: {
    baseURL: baseUrl,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],

  // Artifacts
  outputDir: './test-results'
});
