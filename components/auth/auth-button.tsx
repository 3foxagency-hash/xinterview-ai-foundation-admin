'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const authButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'border border-border-strong bg-transparent text-heading hover:bg-card-hover hover:border-primary/30',
        ghost:
          'border border-primary-soft bg-transparent text-primary hover:bg-active-menu-bg hover:border-primary',
      },
      size: {
        sm: 'h-9 px-3 text-caption gap-1.5',
        md: 'h-10 px-4 text-button gap-2',
        lg: 'h-12 px-6 text-button gap-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof authButtonVariants> {
  loading?: boolean;
  showArrow?: boolean;
}

const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, type = 'button', showArrow = false, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-busy={loading}
        disabled={disabled || loading}
        className={cn(authButtonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 size={18} strokeWidth={2} className="animate-spin" />}
        {children}
        {showArrow && !loading && (
          <ArrowRight size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
    );
  }
);
AuthButton.displayName = 'AuthButton';

export { AuthButton, authButtonVariants };
