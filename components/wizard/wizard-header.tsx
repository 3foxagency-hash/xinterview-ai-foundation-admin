'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { X, Check, ExternalLink, Loader as Loader2, CircleAlert as AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard, type SaveState } from './wizard-context';
import { WIZARD_STEPS, getStepNumberFromPath, type WizardStep } from '@/lib/wizard-config';
import { track } from '@/lib/utils/analytics';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-body-sm text-muted" aria-live="polite">
        <Loader2 size={14} className="animate-spin" />
        <span className="hidden lg:inline">Saving…</span>
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-body-sm text-muted" aria-live="polite">
        <Check size={14} className="text-success" />
        <span className="hidden lg:inline">Saved just now</span>
      </span>
    );
  }
  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-body-sm text-error hover:underline"
        aria-live="assertive"
      >
        <AlertCircle size={14} />
        <span>Not saved — retry</span>
      </button>
    );
  }
  return null;
}

function StepPill({
  step,
  state,
  clickable,
  jobId,
}: {
  step: WizardStep;
  state: 'complete' | 'current' | 'upcoming';
  clickable: boolean;
  jobId: string | null;
}) {
  const lockedReason = jobId === null ? 'Add the job details first.' : 'Add at least one question first.';

  const circle = (
    <span
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold tabular-nums transition-colors',
        state === 'current' && 'bg-primary text-primary-foreground',
        state === 'complete' && 'bg-success text-success-foreground',
        state === 'upcoming' && 'border border-border-strong text-muted'
      )}
      aria-hidden
    >
      {state === 'complete' ? <Check size={14} strokeWidth={2.5} /> : step.number}
    </span>
  );

  const label = (
    <span
      className={cn(
        'whitespace-nowrap text-body-sm font-medium transition-colors',
        state === 'current' && 'text-heading underline underline-offset-4 decoration-primary decoration-2',
        state === 'complete' && 'text-heading',
        state === 'upcoming' && 'text-muted'
      )}
    >
      {step.label}
    </span>
  );

  const inner = (
    <div
      className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
      aria-current={state === 'current' ? 'step' : undefined}
    >
      {circle}
      {label}
    </div>
  );

  if (clickable) {
    return (
      <Link href={step.href(jobId)} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
        {inner}
      </Link>
    );
  }

  if (state === 'upcoming') {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-default rounded-md">{inner}</div>
          </TooltipTrigger>
          <TooltipContent>{lockedReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className="cursor-default rounded-md">{inner}</div>;
}

export function WizardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { job, jobId, saveState, retrySave, isDirty, questionCount } = useWizard();
  const [confirmExit, setConfirmExit] = React.useState(false);
  const currentStepNumber = getStepNumberFromPath(pathname ?? '');

  const isDraft = job?.status === 'draft';

  const handleExit = () => {
    if (isDirty) {
      setConfirmExit(true);
    } else {
      router.push('/jobs');
    }
  };

  const handleSaveDraft = () => {
    if (saveState === 'error') {
      retrySave();
      return;
    }
    if (saveState === 'saving') {
      return;
    }
    toast.success('Draft saved');
  };

  const candidateUrl = job?.candidateUrl;

  return (
    <>
      <header
        className="sticky top-0 z-topbar shrink-0 border-b border-border bg-surface"
        role="banner"
      >
        {/* Row 1 — main bar */}
        <div className="flex h-[60px] items-center justify-between gap-4 px-4 md:px-6">
          {/* Left — close + title */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleExit}
              aria-label="Close wizard and return to jobs"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-h3 text-heading">Create new job</h1>
                {isDraft && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-warning-border bg-warning-wash px-2 py-0.5 text-caption font-medium text-warning-ink">
                    Draft
                  </span>
                )}
              </div>
              <p className="hidden text-body-sm text-muted sm:block">
                Build a professional interview experience
              </p>
            </div>
          </div>

          {/* Right — save indicator + actions */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden md:block">
              <SaveIndicator state={saveState} onRetry={retrySave} />
            </div>
            {candidateUrl ? (
              <a
                href={candidateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <ExternalLink size={15} strokeWidth={1.5} />
                <span className="hidden sm:inline">Preview</span>
              </a>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled
                      aria-label="Preview landing page (available after job is created)"
                      className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-muted opacity-50"
                    >
                      <ExternalLink size={15} strokeWidth={1.5} />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    The landing page becomes available once the job is created
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveState === 'saving'}
              aria-busy={saveState === 'saving'}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <Save size={15} strokeWidth={1.5} />
              <span className="hidden sm:inline">Save draft</span>
            </button>
          </div>
        </div>

        {/* Row 2 — horizontal step tracker (desktop) */}
        <div className="hidden items-center justify-center gap-1 border-t border-border px-6 py-2 md:flex">
          <nav aria-label="Wizard steps" className="flex items-center gap-1">
            {WIZARD_STEPS.map((step, index) => {
              const state: 'complete' | 'current' | 'upcoming' =
                step.number < currentStepNumber
                  ? 'complete'
                  : step.number === currentStepNumber
                    ? 'current'
                    : 'upcoming';
              const unlocked = jobId !== null && (step.number <= 2 || questionCount > 0);
              const clickable = unlocked && state !== 'current';

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div
                      className={cn(
                        'mx-1 h-px w-6 transition-colors',
                        state !== 'upcoming' ? 'bg-success' : 'bg-border'
                      )}
                      aria-hidden
                    />
                  )}
                  <StepPill step={step} state={state} clickable={clickable} jobId={jobId} />
                </React.Fragment>
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
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 id="exit-confirm-title" className="text-h2 text-heading">
              Leave without saving?
            </h2>
            <p className="mt-2 text-body text-bodyText">
              Your changes to this step haven&apos;t been saved yet.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                autoFocus
                className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  track('wizard_exited');
                  router.push('/jobs');
                }}
                className="inline-flex h-9 items-center rounded-md bg-error px-4 text-button text-error-foreground transition-colors hover:bg-error-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
