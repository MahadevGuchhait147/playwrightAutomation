import { afterEach, describe, expect, it } from 'vitest';
import {
  capitalize,
  formatDateWithCurrentMonth,
  formatTableData,
  generateAccountData,
  generateRandomNumber,
  getFormattedDateFromInput,
  getRequiredEnv
} from '../utils/helpers';

describe('getRequiredEnv', () => {
  const envName = 'UNIT_TEST_REQUIRED_ENV';

  afterEach(() => {
    delete process.env[envName];
  });

  it('returns the environment value when it is set', () => {
    process.env[envName] = 'qa-user';

    expect(getRequiredEnv(envName)).toBe('qa-user');
  });

  it('throws when the environment variable is missing', () => {
    expect(() => getRequiredEnv(envName)).toThrow(
      `Missing required environment variable: ${envName}`
    );
  });
});

describe('generateRandomNumber', () => {
  it('returns an integer within the inclusive min and max range', () => {
    const result = generateRandomNumber(10, 5);

    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThanOrEqual(5);
    expect(result).toBeLessThanOrEqual(10);
  });
});

describe('capitalize', () => {
  it('uppercases the first character and lowercases the rest', () => {
    expect(capitalize('jAN')).toBe('Jan');
  });
});

describe('formatDateWithCurrentMonth', () => {
  it('pads a single-digit day and uses the current month abbreviation', () => {
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
    const now = new Date();
    const expected = `03 ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    expect(formatDateWithCurrentMonth('3')).toBe(expected);
  });

  it('capitalizes the month when monthType is capitalize', () => {
    const result = formatDateWithCurrentMonth('12', 'capitalize');

    expect(result.startsWith('12 ')).toBe(true);
    expect(result).toMatch(/^[0-9]{2} [A-Z][a-z]{2} \d{4}$/);
  });
});

describe('formatTableData', () => {
  it('trims values and drops empty lines', () => {
    expect(formatTableData(['  Checking  ', '\n', 'Active'])).toEqual(['Checking', 'Active']);
  });
});

describe('getFormattedDateFromInput', () => {
  it('adds an ordinal suffix and the current month name', () => {
    const monthName = new Date().toLocaleString('default', { month: 'long' });

    expect(getFormattedDateFromInput('1')).toBe(`1st ${monthName}`);
    expect(getFormattedDateFromInput('2')).toBe(`2nd ${monthName}`);
    expect(getFormattedDateFromInput('3')).toBe(`3rd ${monthName}`);
    expect(getFormattedDateFromInput('4')).toBe(`4th ${monthName}`);
  });

  it('throws for an invalid day', () => {
    expect(() => getFormattedDateFromInput('0')).toThrow(
      'Invalid day provided. Must be between 1 and 31.'
    );
    expect(() => getFormattedDateFromInput('32')).toThrow(
      'Invalid day provided. Must be between 1 and 31.'
    );
  });
});

describe('generateAccountData', () => {
  it('returns account fields used by the e2e tests', () => {
    const account = generateAccountData();

    expect(account.name.length).toBeGreaterThan(0);
    expect(Number(account.balance)).toBeGreaterThanOrEqual(1000);
    expect(account.formattedBalance).toBe(Number(account.balance).toLocaleString('en-US'));
    expect(['Checking', 'Savings']).toContain(account.type);
  });
});
