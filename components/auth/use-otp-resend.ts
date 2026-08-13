'use client';

import * as React from 'react';
import { resendOtp, type ApiError } from '@/lib/api/auth';

export interface UseOtpResendOptions {
  email: string;
  mode: 'signup' | 'reset';
  cooldownSeconds?: number;
  maxResends?: number;
  expiryMinutes?: number;
}

export interface UseOtpResendReturn {
  cooldown: number;
  resendsUsed: number;
  maxResends: number;
  canResend: boolean;
  resending: boolean;
  error: string | null;
  expired: boolean;
  expiryRemaining: number;
  resend: () => Promise<void>;
  clearError: () => void;
}

const RESEND_MESSAGES: Record<string, string> = {
  validation_failed:
    'You have requested too many codes. Please contact support or try again later.',
  unauthenticated: 'Your session expired. Please sign in again.',
  network_error: 'Could not reach the server. Check your connection.',
};

const FALLBACK = 'Something went wrong sending your code. Please try again.';

export function useOtpResend({
  email,
  mode,
  cooldownSeconds = 60,
  maxResends = 3,
  expiryMinutes = 10,
}: UseOtpResendOptions): UseOtpResendReturn {
  const [cooldown, setCooldown] = React.useState(cooldownSeconds);
  const [resendsUsed, setResendsUsed] = React.useState(0);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expiryRemaining, setExpiryRemaining] = React.useState(expiryMinutes * 60);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  React.useEffect(() => {
    if (expiryRemaining <= 0) return;
    const interval = setInterval(
      () => setExpiryRemaining((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(interval);
  }, [expiryRemaining]);

  const attemptsExceeded = resendsUsed >= maxResends;
  const expired = expiryRemaining <= 0;
  const canResend = cooldown <= 0 && !attemptsExceeded && !resending && !expired;

  const resend = React.useCallback(async () => {
    if (!canResend) return;
    setResending(true);
    setError(null);
    try {
      await resendOtp(email, mode);
      setResendsUsed((n) => n + 1);
      setCooldown(cooldownSeconds);
    } catch (err) {
      const code = (err as ApiError)?.code;
      setError(RESEND_MESSAGES[code ?? ''] ?? FALLBACK);
      // A 429 from the backend means the cap is reached regardless of our
      // local count, so stop offering a resend.
      if ((err as { retryAfter?: number })?.retryAfter) {
        setResendsUsed(maxResends);
      }
    } finally {
      setResending(false);
    }
  }, [canResend, email, mode, cooldownSeconds, maxResends]);

  const clearError = React.useCallback(() => setError(null), []);

  return {
    cooldown,
    resendsUsed,
    maxResends,
    canResend,
    resending,
    error,
    expired,
    expiryRemaining,
    resend,
    clearError,
  };
}
