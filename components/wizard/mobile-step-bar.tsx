'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface MobileStepBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export function MobileStepBar({ currentStep, totalSteps, stepLabel }: MobileStepBarProps) {
  const [open, setOpen] = React.useState(false);
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="border-b border-border bg-surface md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-semibold text-heading">
            Step {currentStep} of {totalSteps} · {stepLabel}
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
