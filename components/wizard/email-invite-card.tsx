'use client';

import * as React from 'react';
import { Mail, Plus, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { InviteStatusBadge } from './invite-status-badge';
import { CustomFieldDialog } from './custom-field-dialog';
import { emailSchema } from '@/lib/validation/auth';
import {
  addInviteCandidates,
  removeInviteCandidate,
  createCustomField,
  type InviteCandidate,
  type CustomField,
  type CustomFieldType,
} from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

interface EmailInviteCardProps {
  id?: string;
  jobId: string;
  candidates: InviteCandidate[];
  customFields: CustomField[];
  onCustomFieldsChanged: (fields: CustomField[]) => void;
  onCandidatesChanged: (candidates: InviteCandidate[]) => void;
}

type EntryRow = {
  firstName: string;
  lastName: string;
  email: string;
  customFields: Record<string, string>;
  error?: string;
};

function emptyRow(fieldIds: string[]): EntryRow {
  return {
    firstName: '',
    lastName: '',
    email: '',
    customFields: Object.fromEntries(fieldIds.map((id) => [id, ''])),
  };
}

export function EmailInviteCard({
  id,
  jobId,
  candidates,
  customFields,
  onCustomFieldsChanged,
  onCandidatesChanged,
}: EmailInviteCardProps) {
  const { setSaveState } = useWizard();
  const [entry, setEntry] = React.useState<EntryRow>(() => emptyRow([]));
  const [fieldDialogOpen, setFieldDialogOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const firstNameRef = React.useRef<HTMLInputElement>(null);
  const [editing, setEditing] = React.useState<{ id: string; field: 'name' | 'email' } | null>(null);
  const [editValue, setEditValue] = React.useState('');

  // Bulk and ATS imports join this list too (§6, §7) — it's the one place
  // every queued/sent candidate shows, regardless of how they were added.
  const emailInviteRows = candidates;
  const existingEmails = new Set(candidates.map((c) => c.email.toLowerCase()));

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return undefined;
    const result = emailSchema.safeParse(email);
    if (!result.success) return result.error.errors[0]?.message ?? 'Enter a valid email';
    if (existingEmails.has(email.toLowerCase())) return 'This email is already invited.';
    return undefined;
  };

  const handleEmailBlur = () => {
    const error = validateEmail(entry.email);
    setEntry((prev) => ({ ...prev, error }));
  };

  const canAdd = entry.firstName.trim() && entry.lastName.trim() && entry.email.trim() && !entry.error;

  const handleAddRow = async () => {
    const error = validateEmail(entry.email) ?? (!entry.firstName.trim() ? 'First name is required' : !entry.lastName.trim() ? 'Last name is required' : undefined);
    if (error) {
      setEntry((prev) => ({ ...prev, error }));
      return;
    }
    setAdding(true);
    setSaveState('saving');
    try {
      const [added] = await addInviteCandidates(jobId, 'email', [
        {
          firstName: entry.firstName.trim(),
          lastName: entry.lastName.trim(),
          email: entry.email.trim(),
          customFields: entry.customFields,
        },
      ]);
      onCandidatesChanged([...candidates, added]);
      track('candidate_invite_added', { method: 'email' });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      setEntry(emptyRow(customFields.map((f) => f.id)));
      firstNameRef.current?.focus();
    } catch {
      setSaveState('error');
      toast.error('Could not add this candidate');
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canAdd) {
      e.preventDefault();
      handleAddRow();
    }
  };

  const handleRemove = async (candidateId: string, name: string) => {
    const previous = candidates;
    onCandidatesChanged(candidates.filter((c) => c.id !== candidateId));
    try {
      await removeInviteCandidate(jobId, candidateId);
      track('candidate_invite_removed', {});
      toast.success(`Removed ${name}`);
    } catch {
      onCandidatesChanged(previous);
      toast.error('Could not remove this candidate');
    }
  };

  const handleCreateField = async (input: { label: string; type: CustomFieldType }) => {
    const field = await createCustomField(jobId, input);
    onCustomFieldsChanged([...customFields, field]);
    setEntry((prev) => ({ ...prev, customFields: { ...prev.customFields, [field.id]: '' } }));
  };

  // ─── Inline edit ───
  const startEdit = (candidate: InviteCandidate, field: 'name' | 'email') => {
    setEditing({ id: candidate.id, field });
    setEditValue(field === 'name' ? `${candidate.firstName} ${candidate.lastName}` : candidate.email);
  };

  const commitEdit = () => {
    if (!editing) return;
    const target = candidates.find((c) => c.id === editing.id);
    if (!target) return setEditing(null);
    if (editing.field === 'email') {
      const result = emailSchema.safeParse(editValue);
      if (!result.success) {
        toast.error('Enter a valid email address');
        return;
      }
      onCandidatesChanged(candidates.map((c) => (c.id === editing.id ? { ...c, email: result.data } : c)));
    } else {
      const [firstName, ...rest] = editValue.trim().split(' ');
      onCandidatesChanged(
        candidates.map((c) =>
          c.id === editing.id ? { ...c, firstName: firstName || c.firstName, lastName: rest.join(' ') || c.lastName } : c
        )
      );
    }
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  return (
    <div id={id} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-h3 text-heading">
            <Mail size={16} className="text-muted" />
            Invite candidates via email
          </h3>
          <p className="mt-1 text-body-sm text-muted">Send personalised invites to candidates.</p>
        </div>
      </div>

      {/* Entry row */}
      <div className="mt-4 rounded-md border border-border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <Input
            ref={firstNameRef}
            value={entry.firstName}
            onChange={(e) => setEntry((prev) => ({ ...prev, firstName: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="First name"
            className="h-10 flex-1"
            aria-label="First name"
          />
          <Input
            value={entry.lastName}
            onChange={(e) => setEntry((prev) => ({ ...prev, lastName: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Last name"
            className="h-10 flex-1"
            aria-label="Last name"
          />
          <div className="flex-[1.4]">
            <Input
              value={entry.email}
              onChange={(e) => setEntry((prev) => ({ ...prev, email: e.target.value, error: undefined }))}
              onBlur={handleEmailBlur}
              onKeyDown={handleKeyDown}
              placeholder="Email address"
              type="email"
              className={cn('h-10', entry.error && 'border-error')}
              aria-label="Email address"
              aria-invalid={!!entry.error}
              aria-describedby={entry.error ? 'entry-email-error' : undefined}
            />
          </div>
          {customFields.map((field) => (
            <Input
              key={field.id}
              value={entry.customFields[field.id] ?? ''}
              onChange={(e) =>
                setEntry((prev) => ({
                  ...prev,
                  customFields: { ...prev.customFields, [field.id]: e.target.value },
                }))
              }
              onKeyDown={handleKeyDown}
              placeholder={field.label}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
              className="h-10 flex-1"
              aria-label={field.label}
            />
          ))}
        </div>
        {entry.error && (
          <p id="entry-email-error" role="alert" className="mt-1.5 text-body-sm text-error">
            {entry.error}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong px-3 text-body-sm text-heading transition-colors hover:bg-card-hover"
              >
                Add custom field
                <ChevronDown size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {customFields.map((f) => (
                <DropdownMenuItem key={f.id} disabled>
                  <Check size={13} className="text-success" /> {f.label}
                </DropdownMenuItem>
              ))}
              {customFields.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={() => setFieldDialogOpen(true)}>
                <Plus size={13} /> Create field
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={handleAddRow}
            disabled={!canAdd || adding}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus size={13} />
            Add candidate
          </button>
        </div>
      </div>

      {/* Added list */}
      <div className="mt-4">
        {emailInviteRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border px-6 py-8 text-center">
            <p className="text-body-sm text-muted">
              No candidates added yet. Add them one at a time, or upload a CSV.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {emailInviteRows.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-active-menu-bg text-caption font-medium text-primary">
                  {c.firstName.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  {editing?.id === c.id && editing.field === 'name' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="w-full rounded border border-border bg-surface px-1.5 py-0.5 text-body-sm font-medium text-heading"
                      aria-label={`Edit name for ${c.firstName} ${c.lastName}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(c, 'name')}
                      className="rounded text-left text-body-sm font-medium text-heading hover:underline"
                    >
                      {c.firstName} {c.lastName}
                    </button>
                  )}
                  {editing?.id === c.id && editing.field === 'email' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="mt-0.5 block w-full rounded border border-border bg-surface px-1.5 py-0.5 text-caption text-muted"
                      aria-label={`Edit email for ${c.firstName} ${c.lastName}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(c, 'email')}
                      className="block rounded text-left text-caption text-muted hover:underline"
                    >
                      {c.email}
                    </button>
                  )}
                </div>

                <InviteStatusBadge status={c.status} />

                <button
                  type="button"
                  onClick={() => handleRemove(c.id, `${c.firstName} ${c.lastName}`)}
                  aria-label={`Remove ${c.firstName} ${c.lastName}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CustomFieldDialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen} onCreate={handleCreateField} />
    </div>
  );
}
