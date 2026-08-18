import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['Playwright_Automation/Tests/unit/**/*.unit.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['dot'],
  },
});
