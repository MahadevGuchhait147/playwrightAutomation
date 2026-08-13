import { test, expect } from '../../../Support/Fixture/login';
import qaCompanyData from '../../../Support/TestData/qaCompany.json';
import AxeBuilder from '@axe-core/playwright';

test.describe('SauceDemo login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto(process.env.QA_COMPANY_PATH ?? '/');
    await loginPage.expectLoginPage();
  });

  test.afterEach(async ({ page }, testInfo) => {
    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations, `Accessibility issues found in ${testInfo.title}`).toEqual([]);
  });

  test('logs in with valid credentials', async ({ loginPage }) => {
    const username = process.env.QA_COMPANY_USERNME;
    const password = process.env.QA_COMPANY_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing required QA company login credentials');
    }

    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
  });

  test('shows an error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login(qaCompanyData.invalidUsername, qaCompanyData.invalidPassword);
    await loginPage.expectLoginError(qaCompanyData.invalidLoginError);
  });
});
