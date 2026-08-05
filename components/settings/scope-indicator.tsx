'use client';

import { Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SettingsScope } from '@/lib/settings-nav-config';

interface ScopeIndicatorProps {
  scope: SettingsScope;
  companyName?: string;
}

export function ScopeIndicator({ scope, companyName }: ScopeIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-body-sm text-muted">
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
  );
}
