'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AuthCard,
  AuthButton,
  AuthInput,
  AuthPasswordField,
  ErrorBanner,
  AuthFooterLink,
  AuthCheckbox,
} from '@/components/auth';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { login, type ApiError } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = React.useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  });

  // Drive the checkbox from form state so the submitted value is always in sync.
  const rememberMe = watch('remember');

  React.useEffect(() => {
    if (rateLimitSeconds <= 0) return;
    const interval = setInterval(() => {
      setRateLimitSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitSeconds]);

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    try {
      await login(data.email, data.password, data.remember);
      toast.success('Welcome back! Redirecting to your dashboard...');
      router.push('/dashboard');
    } catch (err) {
      const error = err as ApiError & { retryAfter?: number };
      if (error.code === 'rate_limited' && error.retryAfter) {
        setRateLimitSeconds(error.retryAfter);
        setAuthError(error.message);
      } else if (error.code === 'account_locked' || error.code === 'unverified') {
        setAuthError(error.message);
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
    }
  };

  const isRateLimited = rateLimitSeconds > 0;

  return (
    <AuthCard
      heading="Welcome back"
      description="Sign in to your XInterview account to continue."
      footer={
        <div className="space-y-6">
          <AuthFooterLink
            prompt="Don't have an account?"
            linkText="Sign up"
            href="/signup"
          />
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/G2-badge-signin.6cb66346.svg"
              alt="G2 recognition badges"
              className="h-16 w-auto opacity-80"
            />
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AnimatePresence initial={false}>
          {authError && <ErrorBanner message={authError} />}
        </AnimatePresence>

        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card-hover px-4 py-3 text-caption text-muted"
          >
            <span>Try again in</span>
            <span className="font-semibold text-heading tabular-nums">
              {Math.floor(rateLimitSeconds / 60)}:
              {(rateLimitSeconds % 60).toString().padStart(2, '0')}
            </span>
          </motion.div>
        )}

        <AuthInput
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          leadingIcon={<Mail size={18} strokeWidth={1.5} />}
          error={errors.email?.message}
          disabled={isRateLimited}
          {...register('email')}
        />

        <AuthPasswordField
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          leadingIcon={<Lock size={18} strokeWidth={1.5} />}
          error={errors.password?.message}
          disabled={isRateLimited}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <AuthCheckbox
            id="remember"
            label="Remember me"
            checked={rememberMe}
            onCheckedChange={(v) => setValue('remember', v)}
          />
          <a
            href="/forgot-password"
            className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline rounded"
          >
            Forgot password?
          </a>
        </div>

        <AuthButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isRateLimited}
          className="w-full"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
