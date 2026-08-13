import type { ApiError } from '@/lib/api/auth';

/**
 * Copy for auth error codes.
 *
 * Keyed on the codes `lib/api/auth.ts` derives from the backend's responses —
 * the API itself sends only human English, with no stable machine identifiers.
 * Anything not listed here falls back to the API's own message when it is
 * user-appropriate, and to a generic line otherwise.
 */
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials:
    'That email and password combination is not correct.',
  account_not_found:
    'We could not find an account for that email address.',
  already_registered:
    'An account with this email may already exist. Try signing in or use a different email.',
  otp_mismatch:
    'The code you entered is invalid. Please double-check and try again.',
  token_expired:
    'This code or link has expired. Please request a new one.',
  token_invalid:
    'This link is invalid or has expired. Please request a new one.',
  password_mismatch: 'Both passwords must match.',
  unauthenticated: 'Your session has expired. Please sign in again.',
  network_error:
    'Could not reach the server. Check your connection and try again.',
  disposable_domain:
    'Please use a valid business or personal email address. Temporary email addresses are not supported.',
};

const FALLBACK = 'Something went wrong. Please try again.';

/**
 * Codes whose backend message is safe to show as-is.
 *
 * Validation messages come straight from the server and name the offending
 * field, which is more useful than any generic line we could substitute.
 */
const PASS_THROUGH = new Set(['validation_failed']);

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code, message } = error as ApiError;
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
    if (PASS_THROUGH.has(code) && message) return message;
    return FALLBACK;
  }
  if (error instanceof Error && error.message) return error.message;
  return FALLBACK;
}

export function getAuthErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as ApiError).code;
  }
  return null;
}

/** Per-field messages, for mapping onto react-hook-form's setError. */
export function getAuthFieldErrors(
  error: unknown
): Record<string, string> | undefined {
  if (typeof error === 'object' && error !== null && 'fieldErrors' in error) {
    return (error as ApiError).fieldErrors;
  }
  return undefined;
}
