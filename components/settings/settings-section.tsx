'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, danger, children }: SettingsSectionProps) {
  return (
    <section>
      <h3 className={cn('text-h3', danger ? 'text-error' : 'text-heading')}>{title}</h3>
      {description && (
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      )}
      <div
        className={cn(
          'mt-4 overflow-hidden rounded-lg border bg-surface',
          danger ? 'border-error' : 'border-border'
        )}
      >
        {children}
      </div>
    </section>
  );
}
