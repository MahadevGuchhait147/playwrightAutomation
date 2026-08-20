import { test } from '@playwright/test';

/**
 * Intentional flaky test used to verify FlakyReporter.
 * Fails on the first attempt, passes on retry (retries: 1).
 */
test('forced flaky check fails once then passes', async () => {
  if (test.info().retry === 0) {
    throw new Error('forced flake on first attempt');
  }
});
