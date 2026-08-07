'use client';

import * as React from 'react';
import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SettingsScope } from '@/lib/settings-nav-config';

interface SettingsPageProps {
  title: string;
  scope: SettingsScope;
  companyName?: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsPage({ title, scope, companyName, description, children }: SettingsPageProps) {
  return (
    <div className="mx-auto w-full max-w-[800px] px-8 py-8">
      <h1 className="text-h1 text-heading">{title}</h1>
      <div className="mt-2 flex items-center gap-2 text-body-sm text-muted">
        {scope === 'company' ? (
          <>
            <Building2 size={16} strokeWidth={1.5} className="shrink-0" />
            <span>These settings apply to everyone in {companyName ?? 'your company'}.</span>
          </>
        ) : (
          <>
            <User size={16} strokeWidth={1.5} className="shrink-0" />
            <span>These settings apply only to you.</span>
          </>
        )}
      </div>
      {description && (
        <p className="mt-4 text-body text-bodyText">{description}</p>
      )}
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}
