'use client';

import * as React from 'react';
import { SettingsSubNav } from '@/components/settings/settings-sub-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // On mobile this is a normal-flow column: the horizontal tab strip sits
    // above the content and the page scrolls as one. From lg up it becomes a
    // fixed-height two-column layout where each side scrolls independently.
    //
    // The height is capped with min-h-0 rather than 100dvh because the
    // dashboard renders a ~69px mobile top bar above this; a full-viewport
    // height there pushed the page past the fold.
    <div className="flex min-h-0 flex-col lg:h-[100dvh] lg:flex-row">
      {/* Desktop: 240px sub-nav with its own scroll */}
      <div className="hidden h-full w-[240px] shrink-0 overflow-y-auto lg:flex lg:flex-col">
        <SettingsSubNav />
      </div>

      {/* Mobile/tablet: horizontal tab strip. An icon-only rail was unusable
          here — 15 unlabelled icons with no way to tell them apart. */}
      <div className="lg:hidden">
        <SettingsSubNav variant="strip" />
      </div>

      {/* Content — min-w-0 lets it shrink instead of forcing the page wide */}
      <div className="min-w-0 flex-1 lg:overflow-y-auto">{children}</div>
    </div>
  );
}
