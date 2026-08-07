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
import { AlertTriangle } from 'lucide-react';

interface ZapierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Jumps to the API keys section so the user can create a key first */
  onGenerateKey: () => void;
}

const STEPS = [
  {
    n: 1,
    body: (
      <>
        Generate an API key in the <strong className="text-heading">API keys</strong> section
        above. The key is shown only once, right after you create it — copy and store it then.
      </>
    ),
  },
  {
    n: 2,
    body: (
      <>
        In Zapier, create a new Zap and choose{' '}
        <strong className="text-heading">XInterview</strong> as the trigger. When prompted,
        paste the API key from step 1 to connect your account.
      </>
    ),
  },
  {
    n: 3,
    body: <>Add the app you want to use as the action (Slack, Gmail, Sheets…) and finish your Zap.</>,
  },
];

export function ZapierDialog({ open, onOpenChange, onGenerateKey }: ZapierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Zapier integration</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Connect XInterview to Slack, Gmail, Typeform and 5,000+ other apps.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-4 py-2">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-semibold text-primary">
                {s.n}
              </span>
              <p className="text-body-sm text-bodyText">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <p className="text-body-sm text-heading">
            Lost your key? Generate a new one — the old key keeps working until you delete it or
            it expires.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={onGenerateKey}
            className="inline-flex h-9 items-center justify-center rounded-md border border-primary/30 px-4 text-button text-primary transition-colors hover:bg-active-menu-bg"
          >
            Generate an API key
          </button>
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
