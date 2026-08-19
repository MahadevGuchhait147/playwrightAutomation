import { test } from '../fixtures/testFixtures';
import accounts from '../testData/accounts.json';
import { generateAccountData } from '../utils/helpers';

test.describe('QA Playground bank accounts', () => {
  test.beforeEach(async ({ authenticatedSession }) => {
    await authenticatedSession();
  });

  test('creates a new account and verifies existing account details', async ({ accountsPage }) => {
    const newAccount = generateAccountData();
    const existing = accounts.existingAccount;

    await accountsPage.goto();
    await accountsPage.expectAccountsList();
    await accountsPage.createAccount(newAccount);
    await accountsPage.expectAccountInList(newAccount.name, newAccount.formattedBalance);
    await accountsPage.openAccountDetails(existing.name);
    await accountsPage.expectAccountDetails(existing.name, existing.balance);
    await accountsPage.expectAccountBalance(existing.balance);
  });
});
