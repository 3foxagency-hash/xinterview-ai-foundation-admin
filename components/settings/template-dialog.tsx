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
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; omit to create a new template */
  initial?: { name: string; description: string } | null;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export function TemplateDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: TemplateDialogProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);

  const editing = !!initial;

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setError(null);
    setLoading(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Give your template a name.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(name, description);
      onOpenChange(false);
    } catch (e2) {
      setError(getSettingsErrorMessage(e2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Rename template' : 'Add template'}</DialogTitle>
          <DialogDescription className="text-body text-muted">
            {editing
              ? 'Update the name and description for this template.'
              : 'Group a set of questions you can reuse when creating a job.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
          <SettingsInput
            ref={nameRef}
            label="Template name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            placeholder="e.g. Engineering screen"
            maxLength={60}
          />
          <SettingsInput
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this template for?"
            maxLength={120}
          />

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {editing ? 'Save changes' : 'Add template'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
