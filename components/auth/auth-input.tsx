'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const authInputWrapper = cva('relative', {
  variants: {
    hasLeading: { true: '', false: '' },
  },
  defaultVariants: { hasLeading: false },
});

export interface AuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof authInputWrapper> {
  label?: string;
  description?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    { className, label, description, error, leadingIcon, id, disabled, ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-[13px] font-medium text-heading"
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descId} className="mb-2 text-caption text-muted">
            {description}
          </p>
        )}
        <div className="group relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={cn(
              'flex h-12 w-full rounded-lg border bg-background px-4 py-2 text-body text-heading transition-all duration-200 placeholder:text-muted',
              'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leadingIcon && 'pl-11',
              error
                ? 'border-error focus-visible:border-error focus-visible:ring-error/10'
                : 'border-border hover:border-border-strong',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <div
            id={errorId}
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-[13px] text-error"
          >
            <AlertCircle size={14} strokeWidth={2} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
AuthInput.displayName = 'AuthInput';

export { AuthInput };
