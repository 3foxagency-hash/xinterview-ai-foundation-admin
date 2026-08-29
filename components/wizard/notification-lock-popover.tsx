'use client';

import { Lock } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface NotificationLockPopoverProps {
  memberName: string;
}

/** Explains why a notification toggle is locked and points to the plan that unlocks it. */
export function NotificationLockPopover({ memberName }: NotificationLockPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Why are notifications locked for ${memberName}?`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Lock size={13} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="text-body-sm text-heading">
          Email notifications are part of the{' '}
          <span className="font-semibold">Growth plan</span> and above.
        </p>
        <a
          href="/settings/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-body-sm font-medium text-primary hover:underline"
        >
          See plans
        </a>
      </PopoverContent>
    </Popover>
  );
}
