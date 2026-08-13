'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AuthCard,
  AuthButton,
  AuthInput,
  AuthSelect,
  RadioCardGroup,
  StepIndicator,
  SuccessPanel,
  ErrorBanner,
} from '@/components/auth';
import { companySetupSchema, type CompanySetupInput } from '@/lib/validation/auth';
import {
  createWorkspace,
  joinWorkspace,
  getInvite,
  type InviteInfo,
} from '@/lib/api/auth';
import { getAuthErrorMessage } from '@/lib/errors/auth-messages';
import { COMPANY_TYPES, type CompanyType } from '@/lib/constants/company-types';

const SIZE_OPTIONS = [
  { value: '1-10', label: '1-10', description: 'Startup' },
  { value: '10-50', label: '10-50', description: 'Small' },
  { value: '50-500', label: '50-500', description: 'Mid-size' },
  { value: '500+', label: '500+', description: 'Enterprise' },
];

function CompanySetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteSlug = searchParams.get('invite');

  const [invite, setInvite] = React.useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(!!inviteSlug);
  const [showForm, setShowForm] = React.useState(!inviteSlug);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [joining, setJoining] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanySetupInput>({
    resolver: zodResolver(companySetupSchema),
    defaultValues: {
      companySize: '',
      companyName: '',
      companyType: '',
      companyWebsite: '',
    },
  });

  const companySize = watch('companySize');
  const companyName = watch('companyName');
  const companyType = watch('companyType');

  React.useEffect(() => {
    if (!inviteSlug) return;
    let active = true;
    (async () => {
      try {
        const info = await getInvite(inviteSlug);
        if (active) {
          setInvite(info);
          setInviteLoading(false);
        }
      } catch {
        if (active) {
          setInviteLoading(false);
          setShowForm(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [inviteSlug]);

  const onSubmit = async (data: CompanySetupInput) => {
    setAuthError(null);
    try {
      await createWorkspace(
        data.companyName,
        data.companySize,
        data.companyType as CompanyType,
        data.companyWebsite
      );
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    }
  };

  const handleJoin = async () => {
    if (!inviteSlug) return;
    setJoining(true);
    setAuthError(null);
    try {
      await joinWorkspace(inviteSlug);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setJoining(false);
    }
  };

  if (success) {
    return (
      <SuccessPanel
        icon={
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <CheckCircle2 size={30} strokeWidth={1.5} className="text-success" />
          </motion.div>
        }
        heading="Workspace created"
        body="Taking you to your dashboard..."
        actionLabel="Go to dashboard"
        onAction={() => router.push('/dashboard')}
      />
    );
  }

  if (inviteLoading) {
    return (
      <div className="flex w-full max-w-[380px] flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-body-sm text-muted">Loading your invite...</p>
      </div>
    );
  }

  return (
    <AuthCard
      heading="Set up your workspace"
      description="This is where your team will run interviews."
    >
      <StepIndicator currentStep={3} />

      <AnimatePresence initial={false}>
        {authError && <ErrorBanner message={authError} />}
      </AnimatePresence>

      {invite && !showForm && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card-hover p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 size={20} strokeWidth={1.5} className="text-primary" />
              </div>
              <div>
                <p className="text-body font-semibold text-heading">
                  Join {invite.company}
                </p>
                <p className="text-caption text-muted">
                  Invited by {invite.inviter}
                </p>
              </div>
            </div>
          </div>

          <AuthButton
            type="button"
            size="lg"
            variant="primary"
            loading={joining}
            onClick={handleJoin}
            className="w-full"
          >
            Join {invite.company}
          </AuthButton>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full text-center text-body-sm text-muted underline-offset-4 transition-colors hover:text-heading hover:underline rounded"
          >
            Create a new workspace instead
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <RadioCardGroup
            label="Company size"
            options={SIZE_OPTIONS}
            value={companySize}
            onChange={(v) => setValue('companySize', v, { shouldValidate: true })}
            error={errors.companySize?.message}
          />

          <AuthInput
            id="companyName"
            label="Company name"
            placeholder="Acme Corp"
            autoComplete="organization"
            error={errors.companyName?.message}
            {...register('companyName')}
          />

          <AuthSelect
            id="companyType"
            label="Company type"
            placeholder="Select a legal entity type"
            options={COMPANY_TYPES.map((t) => ({ value: t, label: t }))}
            value={companyType}
            onChange={(v) => setValue('companyType', v, { shouldValidate: true })}
            error={errors.companyType?.message}
            searchable
          />

          <AuthInput
            id="companyWebsite"
            label="Company website"
            placeholder="https://company.com"
            autoComplete="url"
            error={errors.companyWebsite?.message}
            {...register('companyWebsite')}
          />

          <AuthButton
            type="submit"
            size="lg"
            loading={isSubmitting}
            disabled={!companySize || !companyName || !companyType}
            className="w-full"
          >
            {isSubmitting ? 'Creating workspace...' : 'Create workspace'}
          </AuthButton>
        </form>
      )}
    </AuthCard>
  );
}

export default function CompanySetupPage() {
  return (
    <Suspense fallback={<div className="h-32" />}>
      <CompanySetupContent />
    </Suspense>
  );
}
