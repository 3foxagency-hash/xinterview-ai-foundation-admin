import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* Variants and states follow the Design System v2.0 §9 Buttons spec:
   Primary/Secondary/Ghost/Link/AI/Destructive/Destructive-quiet, each with
   rest/hover/active/focus/disabled treatments driven by tokens. The AI
   variant keeps near-black text on coral (§9.4) — hover/pressed lighten
   instead of darken, since darkening would drop the label below AA. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'border border-border-strong bg-surface text-heading hover:border-border-hover hover:bg-background active:bg-surface-2',
        ghost: 'text-muted hover:bg-surface-hover hover:text-heading active:bg-surface-2',
        link: 'text-primary-ink underline-offset-4 hover:underline',
        ai: 'bg-ai text-heading hover:bg-ai-hover active:bg-ai-pressed',
        destructive: 'bg-error text-error-foreground hover:bg-error-ink active:bg-error-active',
        'destructive-quiet':
          'border border-error-border bg-surface text-error-ink hover:bg-error-wash',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-sm px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
