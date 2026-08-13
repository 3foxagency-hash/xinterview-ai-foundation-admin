'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import {
  AuthCard,
  AuthButton,
  AuthInput,
  AuthPasswordField,
  ErrorBanner,
  AuthFooterLink,
  AuthCheckbox,
  StepIndicator,
} from '@/components/auth';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { register as registerApi, type ApiError } from '@/lib/api/auth';
import { getAuthErrorMessage } from '@/lib/errors/auth-messages';

export default function SignUpPage() {
  const router = useRouter();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [agreed, setAgreed] = React.useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = React.useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  React.useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const onSubmit = async (data: RegisterInput) => {
    if (!agreed) {
      setAuthError('Please accept the Terms of Use and Privacy Policy to continue.');
      return;
    }
    setAuthError(null);
    try {
      await registerApi(data.email, data.password, data.firstName, data.lastName);
      toast.success('Account created! Check your email for a verification code.');
      const params = new URLSearchParams({ email: data.email });
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      const error = err as ApiError & { retryAfter?: number };
      if (error.retryAfter) {
        setRateLimitSeconds(error.retryAfter);
        setAuthError(getAuthErrorMessage(err));
      } else {
        setAuthError(getAuthErrorMessage(err));
        if (error.code === 'already_registered') {
          (document.getElementById('email') as HTMLInputElement)?.focus();
        }
      }
    }
  };

  const onInvalid = (invalidErrors: typeof errors) => {
    const e = invalidErrors;
    if (e.firstName) {
      (document.getElementById('firstName') as HTMLInputElement)?.focus();
    } else if (e.lastName) {
      (document.getElementById('lastName') as HTMLInputElement)?.focus();
    } else if (e.email) {
      (document.getElementById('email') as HTMLInputElement)?.focus();
    } else if (e.password) {
      (document.getElementById('password') as HTMLInputElement)?.focus();
    }
  };

  const isRateLimited = rateLimitSeconds > 0;

  return (
    <AuthCard
      heading="Create your XInterview account"
      description="Start hiring 10x faster. No credit card required."
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          linkText="Sign in"
          href="/login"
        />
      }
    >
      <StepIndicator currentStep={1} />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5" noValidate>
        <AnimatePresence initial={false}>
          {authError && <ErrorBanner message={authError} />}
        </AnimatePresence>

        {isRateLimited && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card-hover px-4 py-3 text-caption text-muted"
          >
            <span>Try again in</span>
            <span className="font-semibold text-heading tabular-nums">
              {Math.floor(rateLimitSeconds / 60)}:
              {(rateLimitSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthInput
            id="firstName"
            label="First name"
            placeholder="Jane"
            autoComplete="given-name"
            error={errors.firstName?.message}
            disabled={isRateLimited}
            {...register('firstName')}
          />
          <AuthInput
            id="lastName"
            label="Last name"
            placeholder="Smith"
            autoComplete="family-name"
            error={errors.lastName?.message}
            disabled={isRateLimited}
            {...register('lastName')}
          />
        </div>

        <AuthInput
          id="email"
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          leadingIcon={<Mail size={18} strokeWidth={1.5} />}
          error={errors.email?.message}
          disabled={isRateLimited}
          {...register('email')}
        />

        <AuthPasswordField
          id="password"
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          showStrength
          error={errors.password?.message}
          disabled={isRateLimited}
          {...register('password')}
        />

        <div>
          <AuthCheckbox
            id="terms"
            label={
              <>
                I agree to the{' '}
                <a
                  href="https://xinterview.ai/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Terms of Use
                </a>{' '}
                and{' '}
                <a
                  href="https://xinterview.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </a>
              </>
            }
            checked={agreed}
            onCheckedChange={setAgreed}
          />
        </div>

        <AuthButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={!agreed || isRateLimited}
          className="w-full"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
