import { test } from '../../../Support/Fixture/login';
import qaCompanyData from '../../../Support/TestData/qaCompany.json';

test.describe('SauceDemo login', () => {
  test.beforeEach(async ({ loginPage, eyes }) => {
    await loginPage.goto(process.env.QA_COMPANY_PATH ?? '/');
    await loginPage.expectLoginPage();
    await eyes.check('Login page');
  });

  test('logs in with valid credentials', async ({ loginPage }) => {
    const username = process.env.QA_COMPANY_USERNAME;
    const password = process.env.QA_COMPANY_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing required QA company login credentials in environment variables');
    }
    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
  });

  test('shows an error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login(qaCompanyData.invalidUsername, qaCompanyData.invalidPassword);
    await loginPage.expectLoginError(qaCompanyData.invalidLoginError);
  });
});
