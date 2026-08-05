'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  label: string;
  helper?: string;
  control: React.ReactNode;
}

export function SettingsRow({ label, helper, control }: SettingsRowProps) {
  return (
    <div className="settings-row flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:py-4 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-border">
      <div className="max-w-[320px]">
        <span className="text-body font-medium text-heading">{label}</span>
        {helper && (
          <p className="mt-1 text-body-sm text-muted">{helper}</p>
        )}
      </div>
      <div className="w-full md:max-w-[400px] md:shrink-0 [&_input]:h-10 [&_button]:h-10">
        {control}
      </div>
    </div>
  );
}
