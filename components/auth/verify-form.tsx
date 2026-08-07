'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import {
  AuthCard,
  AuthButton,
  AuthOTPInput,
  ErrorBanner,
  StepIndicator,
} from '@/components/auth';
import { useOtpResend } from '@/components/auth';
import { verifyOtp, type ApiError } from '@/lib/api/auth';
import { getAuthErrorMessage, getAuthErrorCode } from '@/lib/errors/auth-messages';
import { maskEmail, formatCountdown } from '@/lib/utils/format';

type VerifyMode = 'signup' | 'reset';

export interface VerifyFormProps {
  mode: VerifyMode;
}

export function VerifyForm({ mode }: VerifyFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') ?? 'you@company.com';
  const maskedEmail = maskEmail(email);

  const [code, setCode] = React.useState('');
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [otpError, setOtpError] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = React.useState(0);

  const {
    cooldown,
    canResend,
    resending,
    resendsUsed,
    maxResends,
    error: resendError,
    expired,
    expiryRemaining,
    resend,
  } = useOtpResend({ email, mode });

  React.useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const isSignup = mode === 'signup';

  const heading = isSignup ? 'Verify your email' : 'Enter your reset code';
  const subtext = `We sent a 6-digit code to ${maskedEmail}`;
  const successRoute = isSignup ? '/company-setup' : '/reset-password';
  const backHref = isSignup ? '/signup' : '/forgot-password';
  const backLabel = isSignup ? 'Wrong email? Go back' : 'Wrong email? Go back';

  const handleVerify = React.useCallback(
    async (codeToVerify: string) => {
      if (codeToVerify.length !== 6) return;
      setVerifying(true);
      setAuthError(null);
      setOtpError(false);
      try {
        await verifyOtp(email, codeToVerify, mode);
        toast.success(isSignup ? 'Email verified!' : 'Code verified!');
        router.push(successRoute);
      } catch (err) {
        const errorCode = getAuthErrorCode(err);
        if (errorCode === 'rate_limited') {
          const retryAfter = (err as ApiError & { retryAfter?: number }).retryAfter ?? 60;
          setRateLimitSeconds(retryAfter);
          setAuthError(getAuthErrorMessage(err));
        } else {
          setAuthError(getAuthErrorMessage(err));
          setOtpError(true);
        }
        setCode('');
      } finally {
        setVerifying(false);
      }
    },
    [email, mode, isSignup, router, successRoute]
  );

  const handleCodeChange = (value: string) => {
    setCode(value);
    setOtpError(false);
    setAuthError(null);
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      handleVerify(value);
    }
  };

  const handleResend = async () => {
    setAuthError(null);
    await resend();
    if (!resendError) {
      toast.success('A new code has been sent to your email.');
    }
  };

  const attemptsExceeded = resendsUsed >= maxResends;
  const isRateLimited = rateLimitSeconds > 0;

  const expiryMin = Math.floor(expiryRemaining / 60);
  const expirySec = (expiryRemaining % 60).toString().padStart(2, '0');

  return (
    <AuthCard heading={heading} description={subtext}>
      {isSignup && <StepIndicator currentStep={2} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify(code);
        }}
        className="space-y-5"
        noValidate
      >
        <p className="text-caption text-muted -mt-2">
          Can&apos;t find it? Check your spam folder.
        </p>

        <AnimatePresence initial={false}>
          {authError && <ErrorBanner message={authError} />}
          {resendError && <ErrorBanner message={resendError} />}
        </AnimatePresence>

        {isRateLimited && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card-hover px-4 py-3 text-caption text-muted"
          >
            <span>Too many attempts. Try again in</span>
            <span className="font-semibold text-heading tabular-nums">
              {formatCountdown(rateLimitSeconds)}
            </span>
          </div>
        )}

        <AuthOTPInput
          value={code}
          onChange={handleCodeChange}
          error={otpError}
          groupLabel="6-digit verification code"
          errorMessage={authError ?? 'Please check your code and try again'}
        />

        {!expired && expiryRemaining > 0 && (
          <p className="text-center text-caption text-muted" aria-live="polite">
            Code expires in{' '}
            <span className="font-medium text-heading tabular-nums">
              {expiryMin}:{expirySec}
            </span>
          </p>
        )}

        {expired && (
          <div
            role="alert"
            className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-center text-[13px] text-heading"
          >
            Your code has expired.{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resending}
              className="font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
            >
              Request a new one
            </button>
          </div>
        )}

        <AuthButton
          type="submit"
          size="lg"
          loading={verifying}
          disabled={code.length !== 6 || isRateLimited}
          className="w-full"
        >
          {verifying ? 'Verifying...' : 'Verify'}
        </AuthButton>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <div className="text-body-sm text-bodyText">
          {attemptsExceeded ? (
            <span className="text-muted">
              Too many requests. Please contact{' '}
              <a
                href="mailto:support@xinterview.ai"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@xinterview.ai
              </a>
            </span>
          ) : expired ? null : canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              aria-busy={resending}
              className="font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <span className="text-muted">
              Resend code in{' '}
              <span className="font-medium text-heading tabular-nums">
                {formatCountdown(cooldown)}
              </span>
            </span>
          )}
        </div>

        <div>
          <a
            href={backHref}
            className="text-body-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            {backLabel}
          </a>
        </div>
      </div>
    </AuthCard>
  );
}
