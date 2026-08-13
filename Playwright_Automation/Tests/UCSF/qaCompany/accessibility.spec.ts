import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Homepage accessibility', async ({ page }) => {
  await page.goto('https://dequeuniversity.com/demo/?utm_source=chatgpt.com');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});
