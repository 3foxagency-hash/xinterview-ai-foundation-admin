'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SettingsSelect } from '@/components/settings/settings-select';
import {
  splitName,
  CANDIDATE_STAGES,
  type CandidateEdit,
  type CandidateRecord,
  type CandidateStage,
} from '@/lib/api/candidates';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<'firstName' | 'email', string>>;

/**
 * Edits a candidate's details. Mirrors the live product's "Edit Candidate
 * Information" modal — first name, last name, email, mobile — and adds the
 * stage, which used to live in a per-row "Move" dropdown. Folding it in here
 * keeps one edit surface per candidate instead of two controls in the row.
 */
export function EditCandidateDialog({
  open,
  onOpenChange,
  candidate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateRecord;
  onSave: (patch: CandidateEdit) => Promise<void>;
}) {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [stage, setStage] = React.useState<CandidateStage>('Invited');
  const [errors, setErrors] = React.useState<Errors>({});
  const [saving, setSaving] = React.useState(false);
  const firstRef = React.useRef<HTMLInputElement>(null);

  // Reseeds from the record each time the modal opens, so discarding an edit
  // and reopening shows the saved values rather than the abandoned ones.
  React.useEffect(() => {
    if (!open) return;
    const { firstName: f, lastName: l } = splitName(candidate.name);
    setFirstName(f);
    setLastName(l);
    setEmail(candidate.email);
    setMobile(candidate.mobile ?? '');
    setStage(candidate.stage);
    setErrors({});
    setSaving(false);
    setTimeout(() => firstRef.current?.focus(), 50);
  }, [open, candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = 'Enter a first name.';
    if (!email.trim()) next.email = 'Enter an email address.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await onSave({ firstName, lastName, email, mobile, stage });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit candidate</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Correct the details captured when {candidate.name.split(' ')[0]} was invited to{' '}
            {candidate.jobTitle}.
          </DialogDescription>
        </DialogHeader>

        {/* noValidate so our own messages aren't pre-empted by the native bubble */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cand-first"
              label="First name"
              value={firstName}
              onChange={(v) => {
                setFirstName(v);
                setErrors((p) => ({ ...p, firstName: undefined }));
              }}
              placeholder="Leonard"
              error={errors.firstName}
              inputRef={firstRef}
            />
            <Field
              id="cand-last"
              label="Last name"
              value={lastName}
              onChange={setLastName}
              placeholder="Carter"
            />
          </div>

          <Field
            id="cand-email"
            label="Email"
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            placeholder="carterleonard@gmail.com"
            error={errors.email}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cand-mobile"
              label="Mobile number"
              type="tel"
              value={mobile}
              onChange={setMobile}
              placeholder="+1 555 0110"
              hint="Optional"
            />
            <div>
              <SettingsSelect
                id="cand-stage"
                label="Stage"
                value={stage}
                onChange={(v) => setStage(v as CandidateStage)}
                options={CANDIDATE_STAGES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save changes
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  hint,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-body-sm font-medium text-heading">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted">{hint}</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'h-10 w-full rounded-md border bg-background px-3 text-body text-heading placeholder:text-muted transition-colors',
          error ? 'border-error' : 'border-border hover:border-border-strong'
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
