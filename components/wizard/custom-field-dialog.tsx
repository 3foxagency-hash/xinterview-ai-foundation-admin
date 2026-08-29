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
import { Input } from '@/components/ui/input';
import { Loader as Loader2 } from 'lucide-react';
import type { CustomFieldType } from '@/lib/api/invites';

interface CustomFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { label: string; type: CustomFieldType }) => Promise<void>;
}

const TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
];

export function CustomFieldDialog({ open, onOpenChange, onCreate }: CustomFieldDialogProps) {
  const [label, setLabel] = React.useState('');
  const [type, setType] = React.useState<CustomFieldType>('text');
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setLabel('');
      setType('text');
      setError(null);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!label.trim()) {
      setError('A field label is required');
      return;
    }
    setCreating(true);
    try {
      await onCreate({ label: label.trim(), type });
      onOpenChange(false);
    } catch {
      setError('Could not create this field. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle>Create custom field</DialogTitle>
          <DialogDescription>
            Applies to every candidate invited to this job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="field-label" className="mb-1.5 block text-body-sm font-semibold text-heading">
              Label
            </label>
            <Input
              id="field-label"
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                setError(null);
              }}
              placeholder="e.g. LinkedIn profile"
              aria-invalid={!!error}
              aria-describedby={error ? 'field-label-error' : undefined}
            />
            {error && (
              <p id="field-label-error" role="alert" className="mt-1.5 text-body-sm text-error">
                {error}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-body-sm font-semibold text-heading">Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={type === opt.value}
                  className={
                    type === opt.value
                      ? 'flex h-9 items-center justify-center rounded-md border border-primary/30 bg-active-menu-bg text-body-sm font-medium text-primary'
                      : 'flex h-9 items-center justify-center rounded-md border border-border text-body-sm text-bodyText transition-colors hover:bg-card-hover'
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {creating && <Loader2 size={14} className="animate-spin" />}
            Create field
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
