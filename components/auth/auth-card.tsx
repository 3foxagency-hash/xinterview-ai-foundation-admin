import * as React from 'react';
import { cn } from '@/lib/utils';

export interface AuthCardProps {
  heading: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  heading,
  description,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-heading">
          {heading}
        </h1>
        {description && (
          <p className="mt-2 text-body text-bodyText">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
      {footer && (
        <div className="mt-8 border-t border-border pt-6 text-center">
          {footer}
        </div>
      )}
    </div>
  );
}
