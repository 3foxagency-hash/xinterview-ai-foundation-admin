'use client';

import * as React from 'react';
import { AlertCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  required?: boolean;
  error?: string;
  icon?: LucideIcon;
  description?: string;
}

export const WizardInput = React.forwardRef<HTMLInputElement, WizardInputProps>(
  ({ label, required, error, icon: Icon, description, id, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className="w-full">
        <label htmlFor={inputId} className="mb-2 block text-body-sm font-semibold text-heading">
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </label>
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
              Icon ? 'pl-12 pr-4' : 'px-4',
              error ?'border-error':'border-border',
              className
            )}
            {...props}
          />
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
