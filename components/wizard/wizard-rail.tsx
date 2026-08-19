'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { WIZARD_STEPS, type WizardStep } from '@/lib/wizard-config';
import { toast } from 'sonner';

interface WizardRailProps {
  currentStep: number;
  completedSteps: number[];
}

function StepEntry({
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
  /** Why this step cannot be opened yet, shown on hover. */
  lockedReason?: string;
  jobId: string | null;
  isLast: boolean;
}) {
  const Icon = step.icon;

  const inner = (
    <div
      className={cn(
        'flex items-start gap-4 rounded-2xl px-3 py-3.5 transition-colors duration-150',
        state === 'current' && 'bg-active-menu-bg',
        state !== 'current' && clickable && 'hover:bg-card-hover cursor-pointer',
        !clickable && 'cursor-default'
      )}
      aria-current={state === 'current' ? 'step' : undefined}
      title={!clickable && state !== 'current' ? lockedReason : undefined}
    >
      {/* Left column: icon tile + connector */}
      <div className="flex flex-col items-center">
        {/* Icon tile */}
        <div
          className={cn(
            'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl transition-colors',
            state === 'current' && 'bg-primary shadow-md',
            state === 'complete' && 'border border-border bg-surface',
            state === 'upcoming' && 'border border-border bg-surface'
          )}
        >
          {state === 'complete' ? (
            <Check size={22} strokeWidth={2} className="text-success" />
          ) : (
            <Icon
              size={22}
              strokeWidth={1.5}
              className={state === 'current' ? 'text-primary-foreground' : 'text-muted'}
            />
          )}
        </div>

        {/* Connector */}
        {!isLast && (
          <div className="relative my-1 flex w-[2px] flex-1 items-center justify-center" style={{ minHeight: 20 }}>
            {/* Dotted connector line — pure CSS via repeating-linear-gradient */}
            <div
              className="w-[1.5px] flex-1"
              style={{
                minHeight: 20,
                backgroundImage:
                  state === 'complete'
                    ? 'linear-gradient(var(--primary), var(--primary))'
                    : 'repeating-linear-gradient(to bottom, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)',
              }}
            />
          </div>
        )}
      </div>

      {/* Right column: text */}
      <div className="flex min-w-0 flex-1 flex-col pb-0.5 pt-1">
        {/* Number badge + title row */}
        <div className="flex items-center gap-2">
          {state === 'complete' ? (
            <span
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-success"
              aria-hidden
            >
              <Check size={12} strokeWidth={2.5} className="text-primary-foreground" />
            </span>
          ) : state === 'current' ? (
            <span
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold tabular-nums text-primary-foreground"
              aria-hidden
            >
              {step.number}
            </span>
          ) : (
            <span
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-border-strong text-[11px] tabular-nums text-muted"
              aria-hidden
            >
              {step.number}
            </span>
          )}
          <span
            className={cn(
              'text-[15px] font-semibold leading-snug',
              state === 'current'
                ? 'text-primary'
                : state === 'complete'
                  ? 'text-heading'
                  : 'text-muted'
            )}
          >
            {step.label}
          </span>
        </div>

        {/* Description */}
        <p
          className={cn(
            'mt-1 text-[13px] leading-relaxed',
            state === 'current' ? 'text-bodyText' : 'text-muted'
          )}
        >
          {step.description}
        </p>
      </div>

      {/* Chevron */}
      <ChevronRight
        size={16}
        className={cn(
          'mt-1.5 shrink-0',
          state === 'current' ? 'text-primary/60' : 'text-border-strong'
        )}
      />
    </div>
  );

  if (clickable) {
    return (
      <Link href={step.href(jobId)} className="block focus-visible:rounded-2xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function WizardRail({ currentStep, completedSteps }: WizardRailProps) {
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
      <aside
        className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col overflow-y-auto border-r border-border bg-surface lg:flex xl:w-[320px]"
        aria-label="Wizard navigation"
      >
        {/* ── Header ── */}
        <div className="px-6 pb-5 pt-7">
          {/* Icon row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExit}
              aria-label="Close wizard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card-hover hover:text-heading"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-active-menu-bg">
              <Sparkles size={22} className="text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-5 text-[20px] font-bold leading-tight text-heading">
            Create new job
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Build your interview in minutes
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-border" />

        {/* ── Step list ── */}
        <nav className="flex-1 px-4 py-5" aria-label="Steps">
          {WIZARD_STEPS.map((step, index) => {
            const state: 'complete' | 'current' | 'upcoming' =
              completedSteps.includes(step.number)
                ? 'complete'
                : step.number === currentStep
                  ? 'current'
                  : 'upcoming';
            // Step 2 opens as soon as the job exists. Steps 3–5 need step 2
            // genuinely finished — at least one question — not merely visited,
            // since a job with no questions cannot be sent to anyone.
            const unlocked =
              jobId !== null && (step.number <= 2 || questionCount > 0);
            const clickable = unlocked && state !== 'current';

            return (
              <StepEntry
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

        {/* ── Help card ── */}
        <div className="px-5 pb-6">
          <div className="rounded-2xl bg-active-menu-bg px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <span className="text-[14px] font-semibold text-heading">Need help?</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Use AI to generate job descriptions, questions and more.
            </p>
            <button
              type="button"
              onClick={() => toast.info('AI assistant coming soon')}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface text-[13px] font-medium text-heading transition-colors hover:bg-card-hover"
            >
              <Sparkles size={14} className="text-primary" />
              Try AI assistant
            </button>
          </div>
        </div>
      </aside>

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
