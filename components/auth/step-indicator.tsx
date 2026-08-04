'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const STEPS = ['Account', 'Verify', 'Workspace'] as const;

export interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  className?: string;
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-center gap-2">
        {STEPS.map((label, idx) => {
          const stepNum = idx + 1;
          const isComplete = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isUpcoming = stepNum > currentStep;

          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{ scale: isCurrent ? 1 : 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
                    isComplete && 'bg-primary text-primary-foreground',
                    isCurrent &&
                      'bg-primary text-primary-foreground ring-4 ring-primary/10',
                    isUpcoming && 'border-2 border-border text-muted'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? <Check size={14} strokeWidth={3} /> : stepNum}
                </motion.div>
                <span
                  className={cn(
                    'text-[13px] font-medium transition-colors',
                    isCurrent && 'text-heading',
                    isComplete && 'text-heading',
                    isUpcoming && 'text-muted'
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1 min-w-[12px] transition-colors',
                    stepNum < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="mt-3 text-caption text-muted" aria-live="polite">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}
      </p>
    </div>
  );
}
