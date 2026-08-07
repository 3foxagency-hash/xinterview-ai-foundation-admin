'use client';

import * as React from 'react';

interface DangerZoneCardProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  actionLoading?: boolean;
}

export function DangerZoneCard({ title, description, actionLabel, onAction, actionLoading }: DangerZoneCardProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="max-w-[480px]">
        <h4 className="text-body font-semibold text-error">{title}</h4>
        <p className="mt-1 text-body-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={actionLoading}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-error bg-transparent px-4 text-button text-error transition-colors hover:bg-error-banner-bg disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </div>
  );
}
