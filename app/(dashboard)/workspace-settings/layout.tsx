'use client';

import * as React from 'react';
import { SettingsSubNav } from '@/components/settings/settings-sub-nav';
import { workspaceNavGroups } from '@/lib/settings-nav-config';

export default function WorkspaceSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Same two-column shell as organisation settings — see settings/layout.tsx
  // for why the height is capped with min-h-0 rather than 100dvh.
  return (
    <div className="flex min-h-0 flex-col lg:h-[100dvh] lg:flex-row">
      <div className="hidden h-full w-[240px] shrink-0 overflow-y-auto lg:flex lg:flex-col">
        <SettingsSubNav title="Workspace" groups={workspaceNavGroups} />
      </div>

      <div className="lg:hidden">
        <SettingsSubNav variant="strip" groups={workspaceNavGroups} />
      </div>

      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
