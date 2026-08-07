'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS } from '@/lib/wizard-config';

interface MobileProgressHeaderProps {
  currentStep: number;
  completedSteps: number[];
  jobId: string | null;
}

export function MobileProgressHeader({
  currentStep,
  completedSteps,
  jobId,
}: MobileProgressHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const currentStepData = WIZARD_STEPS[currentStep - 1];
  const progressPercent = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="border-b border-border bg-surface md:hidden">
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between"
        >
          <span className="text-body font-semibold text-heading">
            Step {currentStep} of {WIZARD_STEPS.length} · {currentStepData?.label}
          </span>
          <ChevronDown
            size={16}
            className={cn('text-muted transition-transform', open && 'rotate-180')}
          />
        </button>
        {/* Progress bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-2 py-2">
          {WIZARD_STEPS.map((step) => {
            const state: 'complete' | 'current' | 'upcoming' = completedSteps.includes(
              step.number
            )
              ? 'complete'
              : step.number === currentStep
                ? 'current'
                : 'upcoming';
            const clickable =
              (state === 'complete' || jobId !== null) && state !== 'current';
            const Icon = step.icon;

            const rowContent = (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg p-3',
                  state === 'current' && 'bg-active-menu-bg'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                    state === 'current' && 'bg-primary',
                    state === 'complete' && 'border border-border',
                    state === 'upcoming' && 'border border-border'
                  )}
                >
                  {state === 'complete' ? (
                    <Check size={16} className="text-success" />
                  ) : state === 'current' ? (
                    <Icon size={16} className="text-primary-foreground" />
                  ) : (
                    <Icon size={16} className="text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={cn(
                      'text-body font-semibold',
                      state === 'current' ? 'text-primary' : state === 'complete' ? 'text-heading' : 'text-muted'
                    )}
                  >
                    {step.label}
                  </span>
                  <p className="text-body-sm text-muted">{step.description}</p>
                </div>
              </div>
            );

            return (
              <div key={step.id}>
                {clickable ? (
                  <Link href={step.href(jobId)} onClick={() => setOpen(false)}>
                    {rowContent}
                  </Link>
                ) : (
                  rowContent
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
