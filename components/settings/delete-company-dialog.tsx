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
import { SettingsInput } from './settings-input';
import { deleteCompanySchema } from '@/lib/validation/settings';

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteCompanyDialog({
  open,
  onOpenChange,
  companyName,
  onConfirm,
}: DeleteCompanyDialogProps) {
  const [typedName, setTypedName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const matches = typedName.trim() === companyName;

  React.useEffect(() => {
    if (open) {
      setTypedName('');
      setError(null);
      setLoading(false);
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  const handleConfirm = async () => {
    const result = deleteCompanySchema.safeParse({ confirmName: typedName });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Type the company name to confirm');
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      setError('We could not process this request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-error">Delete company account</DialogTitle>
          <DialogDescription className="text-body text-muted">
            This will permanently delete <strong className="text-heading">{companyName}</strong> and remove all jobs, candidates, interview recordings, reports, and team access. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <SettingsInput
            label={`Type "${companyName}" to confirm`}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            error={error ?? undefined}
            placeholder={companyName}
            autoFocus={false}
          />
        </div>

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
            disabled={!matches || loading}
            aria-busy={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-error px-4 text-button text-error-foreground transition-all hover:bg-error/90 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Delete company
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
