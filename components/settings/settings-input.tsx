'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  leadingAddon?: React.ReactNode;
}

export const SettingsInput = React.forwardRef<HTMLInputElement, SettingsInputProps>(
  ({ className, label, error, leadingAddon: prefix, id, ...props }, ref) => {
    const generatedId = id ?? React.useId();
    const errorId = `${generatedId}-error`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-1.5 block text-body-sm font-medium text-heading">
            {label}
          </label>
        )}
        <div className="flex h-10 w-full items-center rounded-md border border-border bg-background transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 hover:border-border-strong">
          {prefix && (
            <span className="flex h-full shrink-0 items-center border-r border-border bg-muted-bg px-3 text-body-sm text-muted">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={generatedId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'h-full w-full rounded-md bg-transparent px-3 text-body text-heading placeholder:text-muted focus-visible:outline-none',
              prefix && 'rounded-l-none',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);
SettingsInput.displayName = 'SettingsInput';
