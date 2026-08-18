export function getLoginErrorMessage(username: string, password: string): string {
  if (!username.trim() && !password.trim()) {
    return 'Username and password are required';
  }

  if (!username.trim()) {
    return 'Username is required';
  }

  if (!password.trim()) {
    return 'Password is required';
  }

  return 'Invalid credentials';
}
