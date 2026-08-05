'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface SectionCardProps {
  title: string;
  description?: string;
  /** 'indigo' when required fields still empty, 'success' when complete, undefined to hide */
  statusDot?: 'indigo' | 'success';
  statusTooltip?: string;
  /** Right-aligned action in the header (e.g. AI assist button) */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  /** Footer content (actions) */
  footer?: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  statusDot,
  statusTooltip,
  headerAction,
  children,
  footer,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-h2 text-heading">{title}</h2>
            {statusDot && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        statusDot === 'indigo' ? 'bg-primary' : 'bg-success'
                      )}
                      aria-label={statusTooltip}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{statusTooltip}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {description && (
            <p className="mt-1 text-body-sm text-muted">{description}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Body */}
      <div className="px-6">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="mt-6 border-t border-border p-6">{footer}</div>
      )}
    </section>
  );
}
