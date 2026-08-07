'use client';

import * as React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepFooterProps {
  onCancel?: () => void;
  onSaveExit?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
  nextTooltip?: string;
}

export function StepFooter({
  onCancel,
  onSaveExit,
  onNext,
  nextLabel = 'Save and continue',
  nextLoading = false,
  nextDisabled = false,
  nextTooltip,
}: StepFooterProps) {
  return (
    <>
      {/* Desktop footer — inline */}
      <div className="hidden items-center justify-between md:flex">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-10 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onSaveExit && (
            <button
              type="button"
              onClick={onSaveExit}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/30 bg-transparent px-4 text-button text-primary transition-colors hover:bg-active-menu-bg"
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
                'inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-md transition-all hover:bg-primary-hover',
                'disabled:pointer-events-none disabled:opacity-50'
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

      {/* Mobile: sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex flex-col gap-2 border-t border-border bg-surface p-4 md:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            aria-busy={nextLoading}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-button text-primary-foreground shadow-md transition-all hover:bg-primary-hover',
              'disabled:pointer-events-none disabled:opacity-50'
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
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-border-strong text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
          )}
          {onSaveExit && (
            <button
              type="button"
              onClick={onSaveExit}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-primary/30 text-button text-primary transition-colors hover:bg-active-menu-bg"
            >
              Save and exit
            </button>
          )}
        </div>
      </div>
    </>
  );
}
