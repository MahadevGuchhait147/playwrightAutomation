import { expect, type Locator, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Fills an input field with the provided string and asserts that the value matches
export async function inputField(locator: Locator, str: string) {
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  await locator.click();
  await locator.clear();
  await locator.pressSequentially(str);
  await expect(locator).toHaveValue(str);
}

// Waits for an element to be visible and clicks it; optionally asserts text before clicking
export async function clickWebElement(locator: Locator, str?: string) {
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  if (str) {
    await expect(locator).toHaveText(str);
  }
  await locator.click();
}

// Navigates to a given URL and waits for the page to fully load
export async function goToPage(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

// Verifies element is visible and optionally checks for expected text content
export async function visibilityOfElement(locator: Locator, text?: string, normalizeText = true) {
  await expect(locator).toBeVisible({ timeout: 30000 });
  if (text) {
    const textValue = await locator.textContent();
    if (normalizeText) {
      const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
      expect(normalize(textValue || '')).toContain(normalize(text));
    } else {
      expect(textValue?.trim()).toContain(text);
    }
  }
}

// Asserts that the current page URL includes the expected endpoint
export async function assertPageUrl(page: Page, urlEndPoint: string) {
  const escapedEndpoint = urlEndPoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(escapedEndpoint));
}

// Generates a random number between min and max (inclusive)
export function generateRandomNumber(max: number, min: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Capitalizes the first character of a string and lowercases the rest
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Returns a formatted date string with a given day, optional formatting, and current/upcoming month
export function formatDateWithCurrentMonth(
  day: string,
  monthType: string = '',
  currentOrUpcomingMonth: number = 0
): string {
  const date = new Date();
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC'
  ];
  date.setMonth(date.getMonth() + currentOrUpcomingMonth);
  const month = monthNames[date.getMonth()];
  const updatedYear = date.getFullYear();
  const formattedDay = parseInt(day) < 10 ? `0${day}` : `${day}`;
  const formattedMonth = monthType === 'capitalize' ? capitalize(month) : month;
  const space = monthType === 'extraSpace' ? '  ' : ' ';
  return `${formattedDay}${space}${formattedMonth} ${updatedYear}`;
}

// Generates a random Indian-style vehicle number (e.g., KA01AB1234)
export function generateVehicleNumber() {
  const stateCode = faker.string.alpha({ length: 2, casing: 'upper' });
  const rtoCode = faker.string.numeric(2);
  const series = faker.string.alpha({ length: 2, casing: 'upper' });
  const number = faker.string.numeric(4);
  return `${stateCode}${rtoCode}${series}${number}`;
}

// Generates a fake vehicle description including color, year, make, model, type, and VIN
export function generateVehicleDescription() {
  const manufacturer = faker.vehicle.manufacturer();
  const model = faker.vehicle.model();
  const type = faker.vehicle.type();
  const color = faker.color.human();
  const vin = faker.vehicle.vin();
  const year = faker.date.past({ years: 10 }).getFullYear();
  return `${color} ${year} ${manufacturer} ${model} (${type}) - VIN: ${vin}`;
}

// Cleans and formats table data by removing empty lines and trimming whitespace
export function formatTableData(rawData: string[]): string[] {
  return rawData
    .join('')
    .split('\n')
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0);
}

// Waits for a specific API response that matches the endpoint and status code
export async function waitForApiAndStatus(page: Page, apiEndPoint: string, statusCode: number) {
  await page.waitForResponse(
    (response) => response.url().includes(apiEndPoint) && response.status() === statusCode
  );
}

// Generates a user-friendly nudge message for a randomly selected issue
export function generateUserRaisedNudge() {
  const issueType = faker.helpers.arrayElement([
    'blocked parking spot',
    'wrong vehicle detected',
    'QR code not working',
    'payment not processed',
    'gate access denied',
    'spot already occupied'
  ]);
  const followUp = faker.helpers.arrayElement([
    'Our team is looking into it.',
    'We’ve notified the support team.',
    'You’ll hear back shortly.',
    'Thank you for your patience.',
    'We’ll resolve this as soon as possible.',
    'Hang tight while we sort this out.'
  ]);
  const politeStart = faker.helpers.arrayElement([
    'Thanks for reporting',
    'Issue received',
    'Got it',
    'Report noted',
    'We’re on it'
  ]);

  return `${politeStart}! You reported a "${issueType}". ${followUp}`;
}

type UserDataFields = {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phoneNumber: string;
  country: string;
  pincode: string;
  company: string;
  website: string;
  isCitizenOfIndia: string;
  locationName: string;
  locationAddress: string;
  description: string;
};

// Generates user data based on selected fields or returns all if none specified
export function generateUserData(...fields: (keyof UserDataFields)[]) {
  const allFields: UserDataFields = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    middleName: faker.person.middleName(),
    email: faker.internet.email(),
    phoneNumber: `${faker.string.numeric(10)}`,
    country: faker.location.country(),
    pincode: faker.location.zipCode('######'),
    company: faker.company.name(),
    website: faker.internet.url(),
    isCitizenOfIndia: faker.datatype.boolean() ? 'Yes' : 'No',
    locationName: faker.location.city(),
    locationAddress: faker.location.streetAddress(),
    description: faker.lorem.paragraph()
  };

  const selected =
    fields.length === 0
      ? allFields
      : fields.reduce<Partial<UserDataFields>>((acc, field) => {
          if (field in allFields) {
            acc[field] = allFields[field];
          }
          return acc;
        }, {});

  return Object.values(selected);
}

// Creates date and month with ordinal suffix (e.g., 5th August)
export function getFormattedDateFromInput(inputDateString: string) {
  const day = parseInt(inputDateString, 10);

  if (isNaN(day) || day < 1 || day > 31) {
    throw new Error('Invalid day provided. Must be between 1 and 31.');
  }

  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });

  const getOrdinalSuffix = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${day}${getOrdinalSuffix(day)} ${monthName}`;
}

export function getRandomDescription(): string {
  return faker.helpers.arrayElement([
    'A peaceful area with trees and benches for relaxation.',
    'An open field for sports, games, and outdoor fun.',
    'A natural zone with walking paths and native plants.',
    'A splash pad and fountain area for family water play.',
    'A fenced dog park with seating and shaded areas.',
    'A scenic trail for walking and cycling around the park.',
    'An event lawn used for concerts and community gatherings.'
  ]);
}

export function fillRandomInternalNote() {
  return faker.helpers.arrayElement([
    'Zone added for monthly staff parking.',
    'Temporary overflow zone - review in 30 days.',
    'EV chargers planned for this area.',
    'Created for visitor access only.',
    'Allocated for morning shift employees.',
    'Test zone for QA verification.',
    'High-demand area, monitor usage weekly.',
    'Accessible parking zone created.',
    'Requires signage update before launch.',
    'Backup zone during maintenance periods.'
  ]);
}

// Selects a random option from a native or custom dropdown
export async function selectRandomDropdown(
  page: Page,
  dropdownSelector: string,
  optionList: string[],
  type: 'native' | 'custom' = 'custom'
) {
  const randomOption = faker.helpers.arrayElement(optionList);

  if (type === 'native') {
    await page.locator(dropdownSelector).selectOption({ label: randomOption });
  } else {
    await page.locator(dropdownSelector).click();
    await page.getByRole('option', { name: randomOption }).click();
  }

  return randomOption;
}

export async function selectRandomOptionFromSelect2Dropdown(page: Page, dropdownSelector: string) {
  await page.locator(dropdownSelector).click();

  const optionsLocator = page.locator('.select2-results__option');

  await optionsLocator.first().waitFor({ state: 'visible', timeout: 5000 });

  const optionCount = await optionsLocator.count();
  if (optionCount === 0) throw new Error('No options available in dropdown');

  const randomIndex = generateRandomNumber(optionCount - 1, 0);
  const randomOption = optionsLocator.nth(randomIndex);

  const optionText = await randomOption.textContent();

  await randomOption.click();

  return optionText?.trim() || '';
}

export function generateFakeCSV(filePath: string, rowCount: number = 10) {
  const headers = ['First Name', 'Last Name', 'Email'];
  const rows = [headers.join(',')];

  for (let i = 0; i < rowCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    rows.push([firstName, lastName, email].join(','));
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  return fs.writeFileSync(filePath, rows.join('\n'), 'utf-8');
}

export function generateZoneData() {
  const name = faker.person.firstName();
  const name1 = faker.person.firstName();
  const company = faker.company.name();
  const email = faker.internet.email();
  const address1 = faker.location.streetAddress();
  const address2 = faker.location.streetAddress();
  const countryName = faker.location.country();
  const cityName = faker.location.city();
  const postalNum = faker.location.zipCode();
  const paragraph = faker.lorem.paragraph();

  return {
    name,
    name1,
    company,
    email,
    address1,
    address2,
    countryName,
    cityName,
    postalNum,
    paragraph
  };
}

export type AccountData = {
  name: string;
  balance: string;
  formattedBalance: string;
  type: 'Checking' | 'Savings';
};

// Generates random bank account data for e2e tests
export function generateAccountData(): AccountData {
  const balanceAmount = faker.number.int({ min: 1000, max: 10000 });
  const type = faker.helpers.arrayElement(['Checking', 'Savings'] as const);

  return {
    name: `${faker.finance.accountName()} ${faker.string.alphanumeric(4)}`,
    balance: String(balanceAmount),
    formattedBalance: balanceAmount.toLocaleString('en-US'),
    type
  };
}
