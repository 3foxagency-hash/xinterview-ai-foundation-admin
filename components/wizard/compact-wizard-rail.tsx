'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PanelLeft, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { WIZARD_STEPS } from '@/lib/wizard-config';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface CompactWizardRailProps {
  currentStep: number;
  completedSteps: number[];
  onExpand: () => void;
}

export function CompactWizardRail({
  currentStep,
  completedSteps,
  onExpand,
}: CompactWizardRailProps) {
  const { jobId, isDirty } = useWizard();
  const router = useRouter();

  const handleExit = () => {
    if (isDirty) {
      // simplified — just go to dashboard in compact mode
      router.push('/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[88px] shrink-0 flex-col items-center border-r border-border bg-surface px-2 py-4 xl:flex"
      aria-label="Wizard navigation (compact)"
    >
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand navigation"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <PanelLeft size={18} strokeWidth={1.5} />
      </button>

      <button
        type="button"
        onClick={handleExit}
        aria-label="Close wizard"
        className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X size={18} strokeWidth={1.5} />
      </button>

      <div className="mx-2 my-3 h-px w-8 bg-border" />

      {/* Step tiles */}
      <TooltipProvider delayDuration={200}>
        <nav className="flex flex-col items-center" aria-label="Steps">
          {WIZARD_STEPS.map((step, index) => {
            const state: 'complete' | 'current' | 'upcoming' = completedSteps.includes(
              step.number
            )
              ? 'complete'
              : step.number === currentStep
                ? 'current'
                : 'upcoming';
            const clickable = jobId !== null && state !== 'current';
            const Icon = step.icon;

            const tile = (
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                    state === 'current' && 'bg-primary shadow-sm',
                    state === 'complete' && 'border border-border',
                    state === 'upcoming' && 'border border-border'
                  )}
                >
                  {state === 'complete' ? (
                    <Check size={18} strokeWidth={2} className="text-success" />
                  ) : (
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      className={
                        state === 'current'
                          ? 'text-primary-foreground'
                          : 'text-muted'
                      }
                    />
                  )}
                </div>
                {/* Numeral badge */}
                <span
                  className={cn(
                    'mt-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                    state === 'current'
                      ? 'bg-primary text-primary-foreground'
                      : state === 'complete'
                        ? 'bg-success text-primary-foreground'
                        : 'border border-border text-muted'
                  )}
                >
                  {state === 'complete' ? '✓' : step.number}
                </span>
                {/* Connector */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className="my-1 w-[1.5px]"
                    style={{
                      height: 16,
                      backgroundImage:
                        state === 'complete'
                          ? 'linear-gradient(var(--primary), var(--primary))'
                          : 'repeating-linear-gradient(to bottom, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)',
                    }}
                  />
                )}
              </div>
            );

            const tooltipContent = `${step.number}. ${step.label} — ${step.description}`;

            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  {clickable ? (
                    <Link
                      href={step.href(jobId)}
                      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-xl"
                    >
                      {tile}
                    </Link>
                  ) : (
                    <div>{tile}</div>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  {tooltipContent}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>
    </aside>
  );
}

