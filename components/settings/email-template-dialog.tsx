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
import { SettingsInput } from './settings-input';
import { PlaceholderEditor, type PlaceholderEditorHandle } from './placeholder-editor';
import {
  EMAIL_PLACEHOLDERS,
  renderEmailPreview,
  type EmailTemplate,
} from '@/lib/api/email-templates';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
  onSave: (subject: string, body: string) => Promise<void>;
  onReset: () => Promise<{ subject: string; body: string }>;
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
  onReset,
}: EmailTemplateDialogProps) {
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const subjectRef = React.useRef<HTMLInputElement>(null);
  const bodyEditorRef = React.useRef<PlaceholderEditorHandle>(null);

  // Seed only when the dialog opens, so saving doesn't reset the draft.
  const templateRef = React.useRef(template);
  templateRef.current = template;
  React.useEffect(() => {
    if (!open) return;
    setSubject(templateRef.current?.subject ?? '');
    setBody(templateRef.current?.body ?? '');
    setMode('edit');
    setLoading(false);
    setResetting(false);
    setError(null);
  }, [open]);

  // Which field the caret was last in. Clicking a placeholder button moves
  // focus, so the target has to be remembered before the click lands.
  const lastFocus = React.useRef<'subject' | 'body'>('body');
  const caret = React.useRef<{ start: number; end: number } | null>(null);

  const rememberSubjectCaret = () => {
    const el = subjectRef.current;
    if (!el) return;
    lastFocus.current = 'subject';
    caret.current = {
      start: el.selectionStart ?? subject.length,
      end: el.selectionEnd ?? subject.length,
    };
  };

  const insertPlaceholder = (token: string) => {
    if (lastFocus.current === 'subject') {
      const el = subjectRef.current;
      const { start, end } = caret.current ?? { start: subject.length, end: subject.length };
      const next = subject.slice(0, start) + token + subject.slice(end);
      setSubject(next);
      caret.current = { start: start + token.length, end: start + token.length };
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(start + token.length, start + token.length);
      });
      return;
    }
    bodyEditorRef.current?.insertPlaceholder(token);
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      await onSave(subject, body);
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
      setSubject(def.subject);
      setBody(def.body);
    } catch (e) {
      setError(getSettingsErrorMessage(e));
    } finally {
      setResetting(false);
    }
  };

  if (!template) return null;

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
            <SettingsInput
              ref={subjectRef}
              label="Subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setError(null);
                rememberSubjectCaret();
              }}
              onFocus={rememberSubjectCaret}
              onKeyUp={rememberSubjectCaret}
              onSelect={rememberSubjectCaret}
              placeholder="Enter subject"
            />

            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-heading">
                Message
              </label>
              <div onFocusCapture={() => (lastFocus.current = 'body')}>
                <PlaceholderEditor
                  ref={bodyEditorRef}
                  value={body}
                  onChange={setBody}
                  placeholder="Write your email…"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-body-sm font-medium text-heading">Insert placeholder</p>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_PLACEHOLDERS.map((t) => (
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
                Click to insert. Each is replaced with the right value for the candidate and job.
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
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-muted-bg px-4 py-2.5">
                <p className="text-caption uppercase tracking-wider text-muted">Subject</p>
                <p className="mt-0.5 text-body font-medium text-heading">
                  {renderEmailPreview(subject) || 'No subject'}
                </p>
              </div>
              <div
                className="prose-sm max-w-none px-4 py-3 text-body text-bodyText [&_p]:mb-2 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: renderEmailPreview(body) }}
              />
            </div>
            <p className="mt-2 text-body-sm text-muted">
              Placeholders are filled with sample data so you can see the real shape.
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
            disabled={loading}
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
