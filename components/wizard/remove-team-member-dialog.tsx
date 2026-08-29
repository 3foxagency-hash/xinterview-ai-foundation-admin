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
import { Loader as Loader2 } from 'lucide-react';

interface RemoveTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  /** 'remove' — a manager removing someone else. 'leave' — the current user removing themselves. */
  variant?: 'remove' | 'leave';
  onConfirm: () => Promise<void>;
}

export function RemoveTeamMemberDialog({
  open,
  onOpenChange,
  memberName,
  variant = 'remove',
  onConfirm,
}: RemoveTeamMemberDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) {
      setLoading(false);
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>
            {variant === 'leave' ? 'Leave this job?' : `Remove ${memberName}?`}
          </DialogTitle>
          <DialogDescription className="text-body text-muted">
            {variant === 'leave'
              ? "You'll lose access to this job and its candidate answers."
              : "They'll lose access to this job and its candidate answers."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-error px-4 text-button text-error-foreground transition-all hover:bg-error/90 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {variant === 'leave' ? 'Leave job' : 'Remove'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
