import { type Locator, type Page } from '@playwright/test';
import {
  assertPageUrl,
  clickWebElement,
  goToPage,
  inputField,
  visibilityOfElement
} from '../utils/helpers';

export class LoginPage {
  private static readonly defaultLoginPath = '/bank/login';

  page: Page;
  usernameInput: Locator;
  passwordInput: Locator;
  loginButton: Locator;
  errorMessage: Locator;
  logoutButton: Locator;

  static getBankLoginPath(): string {
    const raw = process.env.QA_COMPANY_PATH?.trim();
    if (!raw || raw === '/') {
      return LoginPage.defaultLoginPath;
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  // Initialize page and all login page locators
  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('login-username-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-btn');
    this.errorMessage = page.getByTestId('login-error-message');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  // Open the bank login page
  async goto(path = '/bank/login') {
    await goToPage(this.page, path);
  }

  // Enter username and password, then click Sign In
  async login(username: string, password: string) {
    await inputField(this.usernameInput, username);
    await inputField(this.passwordInput, password);
    await clickWebElement(this.loginButton);
  }

  // Verify login page URL and form fields are visible
  async expectLoginPage() {
    await assertPageUrl(this.page, '/bank/login');
    await visibilityOfElement(this.usernameInput);
    await visibilityOfElement(this.passwordInput);
    await visibilityOfElement(this.loginButton);
  }

  // Verify user lands on dashboard after successful login
  async expectLoggedIn() {
    await assertPageUrl(this.page, '/bank/dashboard');
    await visibilityOfElement(this.logoutButton);
  }

  // Verify invalid login shows the expected error message
  async expectLoginError(message: string) {
    await visibilityOfElement(this.errorMessage, message);
  }
}
