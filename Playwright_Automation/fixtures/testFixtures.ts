import { test as base, expect } from '@playwright/test';
import { AccountsPage } from '../pages/AccountsPage';
import { LoginPage } from '../pages/LoginPage';
import users from '../testData/users.json';

type TestFixtures = {
  loginPage: LoginPage;
  accountsPage: AccountsPage;
  authenticatedSession: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  accountsPage: async ({ page }, use) => {
    await use(new AccountsPage(page));
  },

  authenticatedSession: async ({ loginPage }, use) => {
    await use(async () => {
      const username = process.env.QA_COMPANY_USERNAME ?? users.valid.username;
      const password = process.env.QA_COMPANY_PASSWORD ?? users.valid.password;

      await loginPage.goto(process.env.QA_COMPANY_PATH ?? '/bank/login');
      await loginPage.login(username, password);
      await loginPage.expectLoggedIn();
    });
  }
});

export { expect };
