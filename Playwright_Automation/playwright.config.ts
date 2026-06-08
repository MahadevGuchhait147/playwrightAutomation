import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { currentsReporter, type CurrentsConfig } from '@currents/playwright';
import { config as loadEnv } from 'dotenv';

loadEnv({ quiet: true });

const currentsRecordKey = process.env.CURRENTS_RECORD_KEY;

if (!currentsRecordKey) {
  throw new Error('Missing required environment variable: CURRENTS_RECORD_KEY');
}

const currentsConfig: CurrentsConfig = {
  projectId: process.env.CURRENTS_PROJECT_ID ?? 'ZxWc6z',
  recordKey: currentsRecordKey
};

const reporter: ReporterDescription[] = [
  ['list'],
  ['html', { open: 'never' }]
];

export default defineConfig({
  testDir: './Tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [currentsReporter(currentsConfig), ...reporter],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    trace: 'on',
    screenshot: 'on',
    video: 'on'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  outputDir: 'test-results'
});
