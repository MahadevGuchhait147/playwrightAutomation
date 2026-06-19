import { test as base, expect } from '@applitools/eyes-playwright/fixture';
import { LoginPage } from '../pageMethod/LoginPage';

type PageFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  }
});

export { expect };
