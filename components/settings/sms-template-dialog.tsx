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
import { Loader2, Eye, Pencil, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SMS_PLACEHOLDERS,
  SMS_MAX_LENGTH,
  SMS_SEGMENT_LENGTH,
  smsSegments,
  renderSmsPreview,
  type SmsTemplate,
} from '@/lib/api/sms-templates';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface SmsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: SmsTemplate | null;
  onSave: (body: string) => Promise<void>;
  onReset: () => Promise<{ body: string }>;
}

/**
 * Deliberately a sibling of the email dialog rather than a shared component:
 * SMS has no subject, is plain text, and bills per 160-character segment.
 */
export function SmsTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
  onReset,
}: SmsTemplateDialogProps) {
  const [body, setBody] = React.useState('');
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const templateRef = React.useRef(template);
  templateRef.current = template;
  React.useEffect(() => {
    if (!open) return;
    setBody(templateRef.current?.body ?? '');
    setMode('edit');
    setLoading(false);
    setResetting(false);
    setError(null);
  }, [open]);

  const insertPlaceholder = (token: string) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSave(body);
      onOpenChange(false);
    } catch (e) {
      setError(getSettingsErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(null);
    setResetting(true);
    try {
      const def = await onReset();
      setBody(def.body);
    } catch (e) {
      setError(getSettingsErrorMessage(e));
    } finally {
      setResetting(false);
    }
  };

  if (!template) return null;

  const overLimit = body.length > SMS_MAX_LENGTH;
  const segments = smsSegments(body);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription className="text-body text-muted">
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <div className="inline-flex rounded-md border border-border bg-muted-bg p-0.5">
            {(['edit', 'preview'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded px-3 text-body-sm font-medium transition-colors',
                  mode === m ? 'bg-surface text-heading shadow-sm' : 'text-muted hover:text-heading'
                )}
              >
                {m === 'edit' ? <Pencil size={13} /> : <Eye size={13} />}
                {m === 'edit' ? 'Edit' : 'Preview'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-body-sm font-medium text-muted transition-colors hover:text-heading disabled:opacity-50"
          >
            {resetting ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            Reset to default
          </button>
        </div>

        {mode === 'edit' ? (
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label htmlFor="sms-body" className="mb-1.5 block text-body-sm font-medium text-heading">
                Message
              </label>
              <textarea
                id="sms-body"
                ref={bodyRef}
                rows={5}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setError(null);
                }}
                placeholder="Write your text message…"
                aria-invalid={overLimit}
                aria-describedby="sms-count"
                className={cn(
                  'w-full rounded-md border bg-background px-3 py-2 text-body text-heading placeholder:text-muted transition-all',
                  overLimit
                    ? 'border-error'
                    :'border-border hover:border-border-strong'
                )}
              />
              <div className="mt-1.5 flex items-baseline justify-between gap-3">
                <p className="text-body-sm text-muted">
                  Plain text only — links are shortened automatically.
                </p>
                <span
                  id="sms-count"
                  className={cn(
                    'shrink-0 text-body-sm tabular-nums',
                    overLimit ? 'font-medium text-error' : 'text-muted'
                  )}
                >
                  {body.length}/{SMS_MAX_LENGTH} · {segments} segment
                  {segments === 1 ? '' : 's'}
                </span>
              </div>
              {overLimit && (
                <p role="alert" className="mt-1 text-body-sm text-error">
                  Too long. Trim it to {SMS_MAX_LENGTH} characters.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-body-sm font-medium text-heading">Insert placeholder</p>
              <div className="flex flex-wrap gap-1.5">
                {SMS_PLACEHOLDERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertPlaceholder(t)}
                    className="rounded-md border border-border bg-muted-bg px-2 py-1 font-mono text-caption text-bodyText transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-body-sm text-muted">
                Click to insert at the cursor. Each is replaced per candidate and job.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="py-2">
            {/* Phone-style bubble so the length is easy to judge */}
            <div className="mx-auto max-w-[320px] rounded-xl border border-border bg-muted-bg p-4">
              <p className="mb-2 text-center text-caption text-muted">{template.name}</p>
              <div className="rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5 shadow-sm">
                <p className="whitespace-pre-wrap text-body-sm text-heading">
                  {renderSmsPreview(body) || 'No message yet'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-body-sm text-muted">
              {segments} segment{segments === 1 ? '' : 's'} · {SMS_SEGMENT_LENGTH} characters each
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || overLimit}
            aria-busy={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
