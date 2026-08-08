'use client';

import * as React from 'react';
import { Building2 } from 'lucide-react';

/**
 * Every workspace customisation page renders the *same* section component the
 * job wizard uses, scoped to a fixed workspace id instead of a job id. That
 * keeps the two in lockstep: a field added to the wizard shows up here too,
 * and there is no second implementation to drift.
 */
export const WORKSPACE_SCOPE = 'workspace_defaults';

export function WsSectionPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[800px] px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-h1 text-heading">{title}</h1>
      <div className="mt-2 flex items-center gap-2 text-body-sm text-muted">
        <Building2 size={16} strokeWidth={1.5} className="shrink-0" />
        <span>Applies to every new job in this workspace.</span>
      </div>
      <p className="mt-4 text-body text-bodyText">{description}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
