'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { CareerJobListing } from '@/lib/api/settings';

interface CareerListingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: CareerJobListing[];
  onChange: (listings: CareerJobListing[]) => void;
}

export function CareerListingsDialog({
  open,
  onOpenChange,
  listings,
  onChange,
}: CareerListingsDialogProps) {
  const toggle = (id: string, visible: boolean) =>
    onChange(listings.map((l) => (l.id === id ? { ...l, visible } : l)));

  const shown = listings.filter((l) => l.visible && !l.expired).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Select jobs to show</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Jobs appear in the order they were created. Expired jobs can&apos;t be shown.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-border">
          {listings.length === 0 ? (
            <p className="px-4 py-8 text-center text-body-sm text-muted">
              You don&apos;t have any jobs yet.
            </p>
          ) : (
            listings.map((l, i) => (
              <div
                key={l.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-4 py-3',
                  i > 0 && 'border-t border-border'
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      'truncate text-body font-medium',
                      l.expired ? 'text-muted' : 'text-heading'
                    )}
                  >
                    {l.title}
                  </p>
                  {l.expired && (
                    <p className="mt-0.5 text-body-sm text-warning">
                      Expired — won&apos;t appear on your page
                    </p>
                  )}
                </div>
                <Switch
                  checked={l.visible && !l.expired}
                  disabled={l.expired}
                  onCheckedChange={(v) => toggle(l.id, v)}
                  aria-label={`Show ${l.title} on the careers page`}
                />
              </div>
            ))
          )}
        </div>

        <p className="text-body-sm text-muted" aria-live="polite">
          {shown} job{shown === 1 ? '' : 's'} will be listed.
        </p>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
