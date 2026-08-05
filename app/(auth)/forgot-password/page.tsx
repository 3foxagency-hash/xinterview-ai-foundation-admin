'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, MailCheck } from 'lucide-react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  AuthCard,
  AuthButton,
  AuthInput,
  ErrorBanner,
  SuccessPanel,
  useOtpResend,
} from '@/components/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validation/auth';
import { forgotPassword as forgotApi } from '@/lib/api/auth';
import { getAuthErrorMessage } from '@/lib/errors/auth-messages';
import { maskEmail } from '@/lib/utils/format';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resend = useOtpResend({
    email: submittedEmail ?? '',
    mode: 'reset',
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setAuthError(null);
    try {
      await forgotApi(data.email);
      setSubmittedEmail(data.email);
      toast.success('Reset code sent.');
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    }
  };

  if (submittedEmail) {
    const masked = maskEmail(submittedEmail);
    return (
      <SuccessPanel
        icon={<MailCheck size={28} strokeWidth={1.5} className="text-success" />}
        heading="Check your email"
        body={
          <>
            If an account exists for{' '}
            <span className="font-semibold text-heading">{masked}</span>, we&apos;ve sent
            a 6-digit reset code.
          </>
        }
        actionLabel="Continue"
        onAction={() => {
          const params = new URLSearchParams({ email: submittedEmail });
          router.push(`/reset-password/verify?${params.toString()}`);
        }}
      />
    );
  }

  return (
    <AuthCard
      heading="Reset your password"
      description="Enter your work email and we'll send you a reset code."
      footer={
        <a
          href="/login"
          className="text-body-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        >
          Back to sign in
        </a>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {authError && <ErrorBanner message={authError} />}

        <AuthInput
          id="email"
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          leadingIcon={<Mail size={18} strokeWidth={1.5} />}
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <AuthButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Sending reset code...' : 'Send reset code'}
        </AuthButton>

        {submittedEmail === null && (
          <p className="text-center text-caption text-muted">
            Enter your email above to receive a reset code.
          </p>
        )}
      </form>
    </AuthCard>
  );
}
