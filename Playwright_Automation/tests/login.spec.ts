import { test } from '../fixtures/testFixtures';
import { LoginPage } from '../pages/LoginPage';
import users from '../testData/users.json';

test.describe('QA Playground bank login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto(LoginPage.getBankLoginPath());
    await loginPage.expectLoginPage();
  });

  test('logs in with valid credentials', async ({ loginPage }) => {
    const username = process.env.QA_COMPANY_USERNAME ?? users.valid.username;
    const password = process.env.QA_COMPANY_PASSWORD ?? users.valid.password;

    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
  });

  test('shows an error for invalid credentials', async ({ loginPage }) => {
    await loginPage.login(users.invalid.username, users.invalid.password);
    await loginPage.expectLoginError(users.invalid.errorMessage);
  });
});
