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

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  questionCount: number;
  onConfirm: () => Promise<void>;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  templateName,
  questionCount,
  onConfirm,
}: DeleteTemplateDialogProps) {
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
          <DialogTitle>Delete &ldquo;{templateName}&rdquo;?</DialogTitle>
          <DialogDescription className="text-body text-muted">
            {questionCount > 0
              ? `This removes the template and its ${questionCount} question${questionCount === 1 ? '' : 's'}. Jobs already created from it keep their questions.`
              : 'This removes the template. Jobs already created from it keep their questions.'}{' '}
            This cannot be undone.
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
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-error px-4 text-button text-error-foreground shadow-sm transition-colors hover:bg-error/90 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Delete template
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
