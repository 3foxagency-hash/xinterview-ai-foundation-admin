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
import { SettingsSelect } from './settings-select';
import { inviteMemberSchema } from '@/lib/validation/settings';
import { features } from '@/lib/constants/features';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: 'Admin' | 'Member') => Promise<void>;
  seatsFull: boolean;
}

export function InviteDialog({ open, onOpenChange, onInvite, seatsFull }: InviteDialogProps) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'Admin' | 'Member'>('Member');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setEmail('');
      setRole('Member');
      setError(null);
      setLoading(false);
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = inviteMemberSchema.safeParse({ email, role });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onInvite(email.trim(), role);
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
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription className="text-body text-muted">
            They will receive an email invitation to join your workspace.
          </DialogDescription>
        </DialogHeader>

        {/* noValidate so the browser's native bubble doesn't pre-empt the zod
            messages — without it an invalid email silently did nothing. */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 py-2">
          <SettingsInput
            ref={emailRef}
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error ?? undefined}
            placeholder="name@company.com"
          />

          {features.inviteWithRole && (
            <SettingsSelect
              label="Role"
              value={role}
              onChange={(v) => setRole(v as 'Admin' | 'Member')}
              options={[
                { value: 'Member', label: 'Member' },
                { value: 'Admin', label: 'Admin' },
              ]}
              description={
                role === 'Admin'
                  ? 'Admins can invite members, change roles, and manage all jobs and candidates.'
                  : 'Members can view and manage jobs and candidates. They cannot invite or remove team members.'
              }
            />
          )}

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
              disabled={loading || seatsFull}
              aria-busy={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send invite
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
