import type { ApiError } from '@/lib/api/auth';

const AUTH_MESSAGES: Record<string, string> = {
  account_locked:
    'Too many failed attempts. Your account is locked. Please contact your administrator or try again later.',
  unverified:
    'Please verify your email before signing in. Check your inbox for a verification link.',
  rate_limited: 'Too many attempts. Please try again in a minute.',
  already_registered:
    'An account with this email may already exist. Try signing in or use a different email.',
  disposable_domain:
    'Please use a valid business or personal email address. Temporary email addresses are not supported.',
  invalid_otp: 'The code you entered is invalid. Please double-check and try again.',
  expired_otp: 'This code has expired. Please request a new one.',
  otp_attempts_exceeded:
    'You have requested too many codes. Please contact support or try again later.',
  invalid_token: 'This reset link is invalid or has expired. Please request a new one.',
  invalid_reset_token: 'This reset link is invalid or has expired. Please request a new one.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as ApiError).code;
    return AUTH_MESSAGES[code] ?? FALLBACK;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK;
}

export function getAuthErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return (error as ApiError).code;
  }
  return null;
}
