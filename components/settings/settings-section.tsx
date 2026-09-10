'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  /** Omit when the surrounding page already shows this as its own heading
   *  (e.g. the customisation rail's section header) — repeating it as a
   *  second, identical heading here reads as a mistake, not reinforcement. */
  title?: string;
  description?: string;
  danger?: boolean;
  /** The customisation rail already sits inside its own bordered card (see
   *  CustomisationSubNav), so wrapping each section's fields in a second
   *  border-and-shadow card there just nests boxes inside boxes. Workspace
   *  Settings pages have no such outer card, so they keep the default. */
  bordered?: boolean;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, danger, bordered = true, children }: SettingsSectionProps) {
  return (
    <section>
      {(title || description) && (
        <div className={cn(!bordered && 'px-4')}>
          {title && (
            <h3 className={cn('text-h3', danger ? 'text-error' : 'text-heading')}>{title}</h3>
          )}
          {description && (
            <p className={cn('text-body-sm text-muted', title ? 'mt-1' : undefined)}>{description}</p>
          )}
        </div>
      )}
      <div
        className={cn(
          'mt-4',
          bordered && cn(
            'overflow-hidden rounded-lg border bg-surface shadow-sm',
            danger ? 'border-error' : 'border-border-strong'
          )
        )}
      >
        {children}
      </div>
    </section>
  );
}
