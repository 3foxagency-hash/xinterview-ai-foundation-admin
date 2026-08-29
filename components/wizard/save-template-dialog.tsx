'use client';

import * as React from 'react';
import { Loader as Loader2, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question } from '@/lib/api/jobs';
import { saveQuestionTemplate } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  questions,
}: SaveTemplateDialogProps) {
  const [name, setName] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError('Enter a template name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveQuestionTemplate(name.trim(), questions);
      track('question_template_saved', { count: questions.length });
      onOpenChange(false);
    } catch {
      setError('Could not save the template. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save size={18} className="text-muted" />
            Save as template
          </DialogTitle>
          <DialogDescription>
            Save these {questions.length} {questions.length === 1 ? 'question' : 'questions'} as a reusable template for future jobs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="mb-2 block text-body-sm font-medium text-heading">
              Template name
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Senior engineer screening"
              maxLength={60}
              className="h-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            {error && (
              <p role="alert" className="mt-1.5 text-body-sm text-error">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || name.trim().length < 2}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save template
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
