import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-heading ring-offset-background transition-colors placeholder:text-muted-foreground hover:border-border-hover focus-visible:border-primary disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-2 disabled:text-text-disabled disabled:opacity-100',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
