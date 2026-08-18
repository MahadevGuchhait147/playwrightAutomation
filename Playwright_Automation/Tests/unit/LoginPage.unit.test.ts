import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../Support/pageMethod/LoginPage.js';

function createMockLocator() {
  return {
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined)
  };
}

function createMockPage() {
  const locators = {
    username: createMockLocator(),
    password: createMockLocator(),
    loginButton: createMockLocator(),
    errorMessage: createMockLocator()
  };

  const page = {
    goto: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn((selector: string) => {
      if (selector === '[data-test="username"]') return locators.username;
      if (selector === '[data-test="password"]') return locators.password;
      if (selector === '[data-test="login-button"]') return locators.loginButton;
      if (selector === '[data-test="error"]') return locators.errorMessage;
      return createMockLocator();
    })
  };

  return { page, locators };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to the provided path', async () => {
    const { page } = createMockPage();
    const loginPage = new LoginPage(page as never);

    await loginPage.goto('/login');

    expect(page.goto).toHaveBeenCalledWith('/login');
  });

  it('fills credentials and clicks login', async () => {
    const { page, locators } = createMockPage();
    const loginPage = new LoginPage(page as never);

    await loginPage.login('standard_user', 'secret_sauce');

    expect(locators.username.fill).toHaveBeenCalledWith('standard_user');
    expect(locators.password.fill).toHaveBeenCalledWith('secret_sauce');
    expect(locators.loginButton.click).toHaveBeenCalledOnce();
  });
});
