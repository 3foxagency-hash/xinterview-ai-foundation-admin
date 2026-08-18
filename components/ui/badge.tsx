import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* Status badge per Design System v2.0 §13.1: 20px height, pill radius,
   8px horizontal padding, 12/16/500 text. Semantic variants use the
   wash/ink pair for their state — never a module color (§3.4 separation
   rule: a badge is either semantic or territory, never both). */
const badgeVariants = cva(
  'inline-flex h-5 items-center rounded-full border border-transparent px-2 text-[12px] font-medium leading-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-surface-2 text-heading',
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-success-wash text-success-ink',
        info: 'bg-info-wash text-info-ink',
        warning: 'bg-warning-wash text-warning-ink',
        error: 'bg-error-wash text-error-ink',
        ai: 'bg-ai-wash-2 text-ai-ink-strong',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
