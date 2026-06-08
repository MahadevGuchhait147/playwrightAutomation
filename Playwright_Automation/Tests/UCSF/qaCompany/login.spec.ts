import { test } from '../../../Support/Fixture/login';
import qaCompanyData from '../../../Support/TestData/qaCompany.json';

const qaCompanyPath = process.env.QA_COMPANY_PATH ?? '/';
const qaCompanyUsername = process.env.QA_COMPANY_USERNAME;
const qaCompanyPassword = process.env.QA_COMPANY_PASSWORD;

if (!qaCompanyUsername || !qaCompanyPassword) {
  throw new Error('Missing required QA company login credentials in environment variables');
}

test.describe('SauceDemo login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto(qaCompanyPath);
    await loginPage.expectLoginPage();
  });
  test('logs in with valid credentials', async ({ loginPage }) => {
    await loginPage.login(qaCompanyUsername, qaCompanyPassword);
    await loginPage.expectLoggedIn();
  });

  test('shows an error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login(qaCompanyData.invalidUsername, qaCompanyData.invalidPassword);
    await loginPage.expectLoginError(qaCompanyData.invalidLoginError);
  });
});
