'use client';

import * as React from 'react';
import { AlertCircle, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface WizardInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  required?: boolean;
  error?: string;
  icon?: LucideIcon;
  description?: string;
  /** Shown as a small info icon next to the label; click to reveal in a popover
   *  instead of a permanent line of text (keeps the field row single-line). */
  infoTooltip?: string;
  /** Trailing slot inside the field, e.g. a clear button. */
  trailing?: React.ReactNode;
}

export const WizardInput = React.forwardRef<HTMLInputElement, WizardInputProps>(
  ({ label, required, error, icon: Icon, description, infoTooltip, trailing, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center gap-1.5">
          <label htmlFor={inputId} className="block text-body-sm font-semibold text-heading">
            {label}
            {required && <span className="ml-0.5 text-error">*</span>}
          </label>
          {infoTooltip && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`More information about ${label}`}
                  className="flex h-4 w-4 items-center justify-center rounded-sm text-muted hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Info size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-body-sm text-heading" align="start">
                {infoTooltip}
              </PopoverContent>
            </Popover>
          )}
        </div>
        {description && (
          <p id={descId} className="mb-2 text-body-sm text-muted">
            {description}
          </p>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-active-menu-bg">
              <Icon size={16} strokeWidth={1.5} className="text-primary" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={cn(
              'h-12 w-full rounded-md border bg-surface text-body text-heading transition-all duration-200 placeholder:text-muted',
              'disabled:cursor-not-allowed disabled:opacity-50',
              Icon ? 'pl-12' : 'pl-4',
              trailing ? 'pr-10' : 'pr-4',
              error ?'border-error':'border-border',
              className
            )}
            {...props}
          />
          {trailing && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
          )}
        </div>
        {error && (
          <div id={errorId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-body-sm text-error">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
WizardInput.displayName = 'WizardInput';
