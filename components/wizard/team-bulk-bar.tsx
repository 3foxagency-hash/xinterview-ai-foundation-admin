'use client';

import { Bell, BellOff, Trash2, X } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface TeamBulkBarProps {
  selectedCount: number;
  notificationsLocked: boolean;
  onTurnOn: () => void;
  onTurnOff: () => void;
  onRemove: () => void;
  onClear: () => void;
}

export function TeamBulkBar({
  selectedCount,
  notificationsLocked,
  onTurnOn,
  onTurnOff,
  onRemove,
  onClear,
}: TeamBulkBarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-active-menu-bg px-4 py-2.5">
      <span className="text-body-sm font-medium text-heading" aria-live="polite">
        {selectedCount} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {notificationsLocked ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-body-sm text-muted opacity-50"
                  >
                    <Bell size={13} /> Turn notifications on
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Email notifications aren&apos;t on your plan.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            type="button"
            onClick={onTurnOn}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-body-sm text-heading transition-colors hover:bg-card-hover"
          >
            <Bell size={13} /> Turn notifications on
          </button>
        )}
        {notificationsLocked ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-body-sm text-muted opacity-50"
                  >
                    <BellOff size={13} /> Turn notifications off
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Email notifications aren&apos;t on your plan.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            type="button"
            onClick={onTurnOff}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-body-sm text-heading transition-colors hover:bg-card-hover"
          >
            <BellOff size={13} /> Turn notifications off
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-error-border bg-surface px-3 text-body-sm text-error transition-colors hover:bg-error-banner-bg"
        >
          <Trash2 size={13} /> Remove
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
