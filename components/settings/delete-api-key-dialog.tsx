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
import { Loader2 } from 'lucide-react';

interface DeleteApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteApiKeyDialog({
  open,
  onOpenChange,
  keyName,
  onConfirm,
}: DeleteApiKeyDialogProps) {
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
          <DialogTitle>Delete &ldquo;{keyName}&rdquo;?</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Anything using this key — including Zapier Zaps — will stop working immediately.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-error px-4 text-button text-error-foreground shadow-sm transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Delete key
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
