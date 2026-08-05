'use client';

import * as React from 'react';
import { SettingsSubNav } from '@/components/settings/settings-sub-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This div fills the content area that the dashboard layout provides.
    // We use dvh (dynamic viewport height) so it fills exactly the screen.
    // Both columns get their own overflow-y-auto so they scroll independently.
    <div className="flex" style={{ height: '100dvh' }}>
      {/* 240px settings sub-nav — desktop. Fixed height + overflow-y-auto
          means the nav scrolls its own list while the content scrolls separately. */}
      <div className="hidden h-full w-[240px] shrink-0 overflow-y-auto lg:flex lg:flex-col">
        <SettingsSubNav />
      </div>

      {/* 56px icon-only rail — tablet / small screens */}
      <div className="flex h-full w-14 shrink-0 flex-col overflow-y-auto lg:hidden">
        <SettingsSubNav collapsed />
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
