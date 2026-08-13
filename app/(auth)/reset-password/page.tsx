'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Check, X, CheckCircle2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
  AuthCard,
  AuthButton,
  AuthPasswordField,
  AuthInput,
  ErrorBanner,
  SuccessPanel,
} from '@/components/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validation/auth';
import { resetPassword as resetApi, type ApiError } from '@/lib/api/auth';
import { getAuthErrorMessage } from '@/lib/errors/auth-messages';
import { formatCountdown } from '@/lib/utils/format';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [countdown, setCountdown] = React.useState(3);
  const [passwordValue, setPasswordValue] = React.useState('');
  const [confirmValue, setConfirmValue] = React.useState('');
  const [invalidLink, setInvalidLink] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  React.useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, router]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setAuthError(null);
    try {
      await resetApi('mock-token', data.password);
      setSuccess(true);
    } catch (err) {
      const code = (err as ApiError).code;
      if (code === 'token_invalid' || code === 'token_expired') {
        setInvalidLink(true);
      }
      setAuthError(getAuthErrorMessage(err));
    }
  };

  if (success) {
    return (
      <SuccessPanel
        icon={<CheckCircle2 size={30} strokeWidth={1.5} className="text-success" />}
        heading="Password updated"
        body="You can now sign in with your new password."
        actionLabel="Sign in now"
        onAction={() => router.push('/login')}
        countdown={
          <p className="text-caption text-muted" aria-live="polite">
            Redirecting to sign in in{' '}
            <span className="font-medium text-heading tabular-nums">{countdown}</span>s
          </p>
        }
      />
    );
  }

  if (invalidLink) {
    return (
      <AuthCard
        heading="Reset link expired"
        description="This password reset link is invalid or has expired."
      >
        <p className="text-body text-bodyText">
          For your security, reset links expire after a short time. Please request a new
          one to continue.
        </p>
        <AuthButton
          type="button"
          size="lg"
          variant="primary"
          className="w-full"
          onClick={() => router.push('/forgot-password')}
        >
          Request a new reset link
        </AuthButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading="Set a new password"
      description="Choose a password you haven't used before."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AnimatePresence initial={false}>
          {authError && <ErrorBanner message={authError} />}
        </AnimatePresence>

        <AuthPasswordField
          id="password"
          label="New password"
          placeholder="Enter a new password"
          autoComplete="new-password"
          leadingIcon={<Lock size={18} strokeWidth={1.5} />}
          showStrength
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="w-full">
          <AuthPasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            leadingIcon={<Lock size={18} strokeWidth={1.5} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {confirmPassword.length > 0 && (
            <div
              className="mt-2 flex items-center gap-1.5 text-[13px]"
              aria-live="polite"
            >
              {passwordsMatch ? (
                <>
                  <Check size={14} strokeWidth={2.5} className="text-success" />
                  <span className="text-success">Passwords match</span>
                </>
              ) : (
                <>
                  <X size={14} strokeWidth={2.5} className="text-error" />
                  <span className="text-error">Passwords do not match</span>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-body-sm text-muted">
          For your security, this will sign you out on all other devices.
        </p>

        <AuthButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={!passwordsMatch}
          className="w-full"
        >
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
