import { EyesFixture } from '@applitools/eyes-playwright/fixture';
import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { currentsReporter, type CurrentsConfig } from '@currents/playwright';
import { config as loadEnv } from 'dotenv';

loadEnv({ quiet: true });

const currentsRecordKey = process.env.CURRENTS_RECORD_KEY;
const applitoolsApiKey = process.env.APPLITOOLS_API_KEY;
const reportPortalApiKey = process.env.RP_API_KEY;

if (!currentsRecordKey) {
  throw new Error('Missing required environment variable: CURRENTS_RECORD_KEY');
}

if (!applitoolsApiKey) {
  throw new Error('Missing required environment variable: APPLITOOLS_API_KEY');
}

const currentsConfig: CurrentsConfig = {
  projectId: process.env.CURRENTS_PROJECT_ID ?? 'ZxWc6z',
  recordKey: currentsRecordKey
};

const reporter: ReporterDescription[] = [['list'], ['html', { open: 'never' }]];

const reportPortalReporter: ReporterDescription[] = reportPortalApiKey
  ? [
      [
        '@reportportal/agent-js-playwright',
        {
          apiKey: reportPortalApiKey,
          endpoint: process.env.RP_ENDPOINT ?? 'http://localhost:8080/api/v2',
          project: process.env.RP_PROJECT ?? 'superadmin_personal',
          launch: process.env.RP_LAUNCH ?? 'Playwright Evaluation'
        }
      ]
    ]
  : [];

export default defineConfig<EyesFixture>({
  testDir: './Tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [...reportPortalReporter, currentsReporter(currentsConfig), ...reporter],
  use: {
    /* Configuration for Eyes VisualAI */
    eyesConfig: {
      /* The following and other configuration parameters are documented at: https://applitools.com/tutorials/playwright/api/overview */
      apiKey: applitoolsApiKey

      // failTestsOnDiff: false,
      // appName: 'My App',
      // matchLevel: 'Strict',
      // batch: { name: 'My Batch' },
      // proxy: {url: 'http://127.0.0.1:8888'},
      // stitchMode: 'CSS',
      // matchTimeout: 0,
      // waitBeforeScreenshots: 50,
      // saveNewTests: true,
    },

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
