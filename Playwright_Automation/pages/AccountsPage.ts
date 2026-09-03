import { expect, type Locator, type Page } from '@playwright/test';
import { assertPageUrl, clickWebElement, inputField, visibilityOfElement } from '../utils/helpers';

export type NewAccountData = {
  name: string;
  balance: string;
  type?: string;
};

export class AccountsPage {
  page: Page;
  accountsNavLink: Locator;
  pageHeading: Locator;
  accountsTable: Locator;
  addAccountButton: Locator;
  addAccountDialog: Locator;
  accountNameInput: Locator;
  accountTypeCombo: Locator;
  startingBalanceInput: Locator;
  termsCheckbox: Locator;
  submitAccountButton: Locator;

  // Initialize page and all accounts page locators
  constructor(page: Page) {
    this.page = page;
    this.accountsNavLink = page.getByTestId('sidebar-link-accounts');
    this.pageHeading = page.getByRole('heading', { name: 'My Accounts' });
    this.accountsTable = page.getByRole('table', { name: 'Accounts' });
    this.addAccountButton = page.getByRole('button', { name: 'Add Account' });
    this.addAccountDialog = page.getByTestId('add-account-dialog');
    this.accountNameInput = this.addAccountDialog.getByRole('textbox', { name: 'Account Name' });
    this.accountTypeCombo = this.addAccountDialog.getByRole('combobox', { name: 'Account Type' });
    this.startingBalanceInput = this.addAccountDialog.getByRole('spinbutton');
    this.termsCheckbox = this.addAccountDialog.getByRole('checkbox', {
      name: /terms and conditions/i
    });
    this.submitAccountButton = this.addAccountDialog.getByRole('button', { name: 'Add Account' });
  }

  // Open accounts page from sidebar navigation
  async goto() {
    await this.page.waitForLoadState('networkidle');
    await clickWebElement(this.accountsNavLink);
    await assertPageUrl(this.page, '/bank/accounts');
    await visibilityOfElement(this.pageHeading);
  }

  // Verify accounts list page is displayed
  async expectAccountsList() {
    await visibilityOfElement(this.pageHeading);
    await visibilityOfElement(this.accountsTable);
  }

  // Create a new account using the add account dialog
  async createAccount({ name, balance, type = 'Checking' }: NewAccountData) {
    await clickWebElement(this.addAccountButton);
    await visibilityOfElement(this.addAccountDialog);

    await inputField(this.accountNameInput, name);
    await clickWebElement(this.accountTypeCombo);
    await clickWebElement(this.page.getByRole('option', { name: type }));
    await inputField(this.startingBalanceInput, balance);
    await clickWebElement(this.termsCheckbox);
    await clickWebElement(this.submitAccountButton);

    await expect(this.addAccountDialog).not.toBeVisible();
  }

  // Get table row for a specific account name
  accountRow(name: string) {
    return this.accountsTable.getByRole('row').filter({ hasText: name });
  }

  // Verify newly created account appears with correct details
  async expectAccountInList(name: string, balance: string) {
    const row = this.accountRow(name);
    await visibilityOfElement(row);
    await expect(row).toContainText(name);
    await expect(row).toContainText(balance);
  }

  // Open account details from the accounts list
  async openAccountDetails(name: string) {
    const row = this.accountRow(name);
    await clickWebElement(row.getByRole('button', { name: 'View' }));
    await assertPageUrl(this.page, '/bank/accounts/');
  }
  
  // Verify account details page shows correct information
  async expectAccountDetails(name: string, balance: string) {
    await visibilityOfElement(this.page.getByRole('heading', { level: 1, name }));
    await visibilityOfElement(this.page.getByText('Current Balance'));
    await visibilityOfElement(this.page.getByTestId('account-detail-balance'));
  }

  // Verify account balance matches expected value
  async expectAccountBalance(balance: string) {
    const balanceElement = this.page.getByTestId('account-detail-balance');
    await visibilityOfElement(balanceElement, balance);
  }
}
