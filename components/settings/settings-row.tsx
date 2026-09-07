'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  label: string;
  helper?: string;
  control: React.ReactNode;
  /** 'auto' (default) goes side-by-side at md+ viewport width — right for
   *  Workspace Settings' wide pages. 'stacked' always stays label-above-
   *  control regardless of viewport, for contexts with a narrow *container*
   *  regardless of how wide the browser window is (e.g. the 280px
   *  customisation rail) — Tailwind's md: breakpoint reads viewport width,
   *  not container width, so 'auto' would still go side-by-side there and
   *  wrap into a cramped, near-vertical mess. */
  layout?: 'auto' | 'stacked';
}

export function SettingsRow({ label, helper, control, layout = 'auto' }: SettingsRowProps) {
  return (
    <div
      className={cn(
        'settings-row flex flex-col gap-3 px-4 py-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border',
        layout === 'auto' && 'md:flex-row md:items-center md:justify-between md:py-4'
      )}
    >
      <div className={layout === 'auto' ? 'max-w-[320px]' : undefined}>
        <span className="text-body font-medium text-heading">{label}</span>
        {helper && (
          <p className="mt-1 text-body-sm text-muted">{helper}</p>
        )}
      </div>
      {/* Normalises control heights, but switches carry their own slim geometry. */}
      <div
        className={cn(
          'w-full [&_input]:h-10 [&_button:not([role=switch])]:h-10',
          layout === 'auto' && 'md:max-w-[400px] md:shrink-0'
        )}
      >
        {control}
      </div>
    </div>
  );
}
