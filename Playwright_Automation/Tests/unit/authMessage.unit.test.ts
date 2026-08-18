import { describe, expect, it } from 'vitest';
import { getLoginErrorMessage } from '../../Support/Utils/authMessage.js';

describe('getLoginErrorMessage', () => {
  it('returns a message when both fields are empty', () => {
    expect(getLoginErrorMessage('', '')).toBe('Username and password are required');
  });

  it('returns a message when username is missing', () => {
    expect(getLoginErrorMessage('', 'secret')).toBe('Username is required');
  });

  it('returns a message when password is missing', () => {
    expect(getLoginErrorMessage('standard_user', '')).toBe('Password is required');
  });

  it('returns invalid credentials when both fields are provided', () => {
    expect(getLoginErrorMessage('standard_user', 'wrong_password')).toBe('Invalid credentials');
  });
});
