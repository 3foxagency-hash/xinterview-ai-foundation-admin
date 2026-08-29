'use client';

import * as React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepFooterProps {
  onBack?: () => void;
  backLabel?: string;
  onCancel?: () => void;
  onSaveExit?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  nextTooltip?: string;
}

export function StepFooter({
  onBack,
  backLabel = 'Back',
  onCancel,
  onSaveExit,
  onNext,
  nextLabel = 'Save and continue',
  nextLoading = false,
  nextDisabled = false,
  nextTooltip,
}: StepFooterProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-savebar flex items-center justify-between border-t border-border bg-surface px-4 py-3 md:px-6"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Left — back / cancel */}
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        )}
        {onCancel && !onBack && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Right — save & exit + forward action */}
      <div className="flex items-center gap-3">
        {onSaveExit && (
          <button
            type="button"
            onClick={onSaveExit}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/30 bg-transparent px-4 text-button text-primary transition-colors hover:bg-active-menu-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Save and exit
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            aria-busy={nextLoading}
            title={nextDisabled ? nextTooltip : undefined}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover',
              'disabled:pointer-events-none disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
            )}
          >
            {nextLoading && (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                aria-hidden
              />
            )}
            {nextLabel}
            {!nextLoading && <ArrowRight size={16} strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  );
}
