'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { WIZARD_STEPS, type WizardStep } from '@/lib/wizard-config';

interface WizardHeaderProps {
  currentStep: number;
  completedSteps: number[];
}

function StepPill({
  step,
  state,
  clickable,
  lockedReason,
  jobId,
  isLast,
}: {
  step: WizardStep;
  state: 'complete' | 'current' | 'upcoming';
  clickable: boolean;
  lockedReason?: string;
  jobId: string | null;
  isLast: boolean;
}) {
  const Icon = step.icon;

  const circle = (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
        state === 'current' &&
          'border-primary bg-primary text-primary-foreground shadow-md',
        state === 'complete' &&
          'border-success bg-success text-primary-foreground',
        state === 'upcoming' && 'border-border-strong bg-surface text-muted'
      )}
    >
      {state === 'complete' ? (
        <Check size={16} strokeWidth={2.5} />
      ) : (
        <Icon size={16} strokeWidth={1.5} />
      )}
    </div>
  );

  const label = (
    <span
      className={cn(
        'text-body-sm font-semibold transition-colors',
        state === 'current' && 'text-primary',
        state === 'complete' && 'text-heading',
        state === 'upcoming' && 'text-muted'
      )}
    >
      {step.label}
    </span>
  );

  const content = (
    <div
      className="flex items-center gap-2.5"
      aria-current={state === 'current' ? 'step' : undefined}
      title={!clickable && state !== 'current' ? lockedReason : undefined}
    >
      {circle}
      <span className="hidden whitespace-nowrap sm:inline">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center">
      {clickable ? (
        <Link href={step.href(jobId)} className="focus-visible:rounded-md">
          {content}
        </Link>
      ) : (
        content
      )}
      {!isLast && (
        <div
          className="mx-2 h-px w-6 shrink-0 sm:w-10"
          style={{
            backgroundImage:
              state === 'complete'
                ? 'linear-gradient(var(--primary), var(--primary))'
                : 'repeating-linear-gradient(to right, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)',
          }}
        />
      )}
    </div>
  );
}

export function WizardHeader({ currentStep, completedSteps }: WizardHeaderProps) {
  const router = useRouter();
  const { isDirty, jobId, questionCount } = useWizard();
  const [confirmExit, setConfirmExit] = React.useState(false);

  const handleExit = () => {
    if (isDirty) {
      setConfirmExit(true);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <header
        className="sticky top-0 z-topbar shrink-0 border-b border-border bg-surface"
        role="banner"
      >
        <div className="flex flex-col gap-4 px-4 py-4 md:px-8 md:py-5">
          {/* Top row: title + exit */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExit}
                aria-label="Close wizard"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-card-hover hover:text-heading"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-active-menu-bg">
                  <Sparkles size={18} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-h3 leading-tight text-heading">
                    Create new job
                  </h1>
                  <p className="hidden text-body-sm text-muted sm:block">
                    Build your interview in minutes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step progress row */}
          <nav
            className="flex items-center overflow-x-auto pb-1"
            aria-label="Wizard steps"
          >
            {WIZARD_STEPS.map((step, index) => {
              const state: 'complete' | 'current' | 'upcoming' =
                completedSteps.includes(step.number)
                  ? 'complete'
                  : step.number === currentStep
                    ? 'current'
                    : 'upcoming';
              const unlocked =
                jobId !== null && (step.number <= 2 || questionCount > 0);
              const clickable = unlocked && state !== 'current';

              return (
                <StepPill
                  key={step.id}
                  step={step}
                  state={state}
                  clickable={clickable}
                  lockedReason={
                    jobId === null
                      ? 'Add the job details first.'
                      : 'Add at least one question first.'
                  }
                  jobId={jobId}
                  isLast={index === WIZARD_STEPS.length - 1}
                />
              );
            })}
          </nav>
        </div>
      </header>

      {/* Exit confirmation */}
      {confirmExit && (
        <div
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-confirm-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 id="exit-confirm-title" className="text-h3 text-heading">
              Leave the wizard?
            </h2>
            <p className="mt-2 text-body text-bodyText">
              You have unsaved changes. They will be lost if you leave now.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                autoFocus
                className="rounded-xl border border-border-strong px-4 py-2 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rounded-xl bg-error px-4 py-2 text-button text-error-foreground transition-colors hover:bg-error/90"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
