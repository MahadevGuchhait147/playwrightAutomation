const DEFAULT_LOGIN_PATH = '/bank/login';

/** Resolves bank login path; ignores empty or root-only values from CI/env misconfig. */
export function getBankLoginPath(): string {
  const raw = process.env.QA_COMPANY_PATH?.trim();
  if (!raw || raw === '/') {
    return DEFAULT_LOGIN_PATH;
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}
