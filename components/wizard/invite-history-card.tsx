'use client';

import * as React from 'react';
import { format as formatDate } from 'date-fns';
import { History, Search, RotateCcw, Ban, Pencil, Check, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { InviteStatusBadge } from './invite-status-badge';
import { emailSchema } from '@/lib/validation/auth';
import {
  resendInvite,
  revokeInvite,
  updateInviteCandidateEmail,
  RESEND_COOLDOWN_SECONDS,
  type InviteCandidate,
  type InviteStatus,
  type InviteMethod,
} from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

interface InviteHistoryCardProps {
  id?: string;
  jobId: string;
  candidates: InviteCandidate[];
  onCandidatesChanged: (candidates: InviteCandidate[]) => void;
}

const METHOD_LABEL: Record<InviteMethod, string> = { email: 'Email', bulk: 'Bulk upload', ats: 'ATS' };
const STATUS_OPTIONS: InviteStatus[] = ['queued', 'sent', 'opened', 'started', 'completed', 'bounced', 'revoked'];

export function InviteHistoryCard({ id, jobId, candidates, onCandidatesChanged }: InviteHistoryCardProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<InviteStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = React.useState<InviteMethod | 'all'>('all');
  const [resendingId, setResendingId] = React.useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<InviteCandidate | null>(null);
  const [editingBouncedId, setEditingBouncedId] = React.useState<string | null>(null);
  const [editEmail, setEditEmail] = React.useState('');
  const [now, setNow] = React.useState(() => Date.now());

  // Ticks so cooldown countdowns on Resend buttons update live.
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = candidates.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (methodFilter !== 'all' && c.method !== methodFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (!name.includes(q) && !c.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const cooldownRemaining = (c: InviteCandidate): number => {
    if (!c.lastResendAt) return 0;
    const elapsed = (now - new Date(c.lastResendAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
  };

  const handleResend = async (candidate: InviteCandidate) => {
    setResendingId(candidate.id);
    try {
      const updated = await resendInvite(jobId, candidate.id);
      onCandidatesChanged(candidates.map((c) => (c.id === candidate.id ? updated : c)));
      track('invite_resent', {});
      toast.success(`Invite resent to ${candidate.firstName} ${candidate.lastName}`);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not resend this invite';
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const updated = await revokeInvite(jobId, revokeTarget.id);
      onCandidatesChanged(candidates.map((c) => (c.id === revokeTarget.id ? updated : c)));
      track('invite_revoked', {});
      toast.success(`Revoked invite for ${revokeTarget.firstName} ${revokeTarget.lastName}`);
    } catch {
      toast.error('Could not revoke this invite');
    } finally {
      setRevokeTarget(null);
    }
  };

  const startEditBounced = (c: InviteCandidate) => {
    setEditingBouncedId(c.id);
    setEditEmail(c.email);
  };

  const commitBouncedEmail = async (c: InviteCandidate) => {
    const result = emailSchema.safeParse(editEmail);
    if (!result.success) {
      toast.error('Enter a valid email address');
      return;
    }
    try {
      const updated = await updateInviteCandidateEmail(jobId, c.id, result.data);
      onCandidatesChanged(candidates.map((row) => (row.id === c.id ? updated : row)));
      setEditingBouncedId(null);
      toast.success('Email updated — ready to resend');
    } catch {
      toast.error('Could not update this email');
    }
  };

  return (
    <div id={id} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-h3 text-heading">
            <History size={16} className="text-muted" />
            Invite history
          </h3>
          <p className="mt-1 text-body-sm text-muted">See what&apos;s been sent and what happened.</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <p className="mt-6 py-6 text-center text-body-sm text-muted">
          Nothing sent yet. Invites appear here once the job is published.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-9 pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InviteStatus | 'all')}
              className="h-9 rounded-md border border-border bg-surface px-3 text-body-sm text-heading"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as InviteMethod | 'all')}
              className="h-9 rounded-md border border-border bg-surface px-3 text-body-sm text-heading"
              aria-label="Filter by method"
            >
              <option value="all">All methods</option>
              {(Object.keys(METHOD_LABEL) as InviteMethod[]).map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </select>
          </div>

          {/* Table at sm+; stacked rows below that (§12: "the history table becomes stacked rows") */}
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border text-caption text-muted">
                  <th scope="col" className="px-2 py-2 text-left font-medium">Candidate</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Email</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Method</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Sent</th>
                  <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-2.5 font-medium text-heading">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-2 py-2.5 text-bodyText">
                      <EmailCell
                        candidate={c}
                        editing={editingBouncedId === c.id}
                        editValue={editEmail}
                        onEditValueChange={setEditEmail}
                        onCommit={() => commitBouncedEmail(c)}
                        onCancel={() => setEditingBouncedId(null)}
                      />
                    </td>
                    <td className="px-2 py-2.5 text-muted">{METHOD_LABEL[c.method]}</td>
                    <td className="px-2 py-2.5 text-muted">
                      {c.sentAt ? formatDate(new Date(c.sentAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-2 py-2.5">
                      <InviteStatusBadge status={c.status} />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <RowActions
                          candidate={c}
                          editingBouncedId={editingBouncedId}
                          resendingId={resendingId}
                          cooldownRemaining={cooldownRemaining(c)}
                          onEditBounced={() => startEditBounced(c)}
                          onResend={() => handleResend(c)}
                          onRevoke={() => setRevokeTarget(c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-6 text-center text-body-sm text-muted">No invites match your filters.</p>
            )}
          </div>

          <ul className="mt-4 space-y-3 sm:hidden">
            {filtered.map((c) => (
              <li key={c.id} className="rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-heading">
                      {c.firstName} {c.lastName}
                    </p>
                    <div className="mt-0.5 text-caption text-muted">
                      <EmailCell
                        candidate={c}
                        editing={editingBouncedId === c.id}
                        editValue={editEmail}
                        onEditValueChange={setEditEmail}
                        onCommit={() => commitBouncedEmail(c)}
                        onCancel={() => setEditingBouncedId(null)}
                      />
                    </div>
                  </div>
                  <InviteStatusBadge status={c.status} className="shrink-0" />
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                  <span className="text-caption text-muted">
                    {METHOD_LABEL[c.method]}
                    {c.sentAt && ` · ${formatDate(new Date(c.sentAt), 'MMM d, yyyy')}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <RowActions
                      candidate={c}
                      editingBouncedId={editingBouncedId}
                      resendingId={resendingId}
                      cooldownRemaining={cooldownRemaining(c)}
                      onEditBounced={() => startEditBounced(c)}
                      onResend={() => handleResend(c)}
                      onRevoke={() => setRevokeTarget(c)}
                    />
                  </div>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-body-sm text-muted">No invites match your filters.</p>
            )}
          </ul>
        </>
      )}

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>
              Revoke invite for {revokeTarget?.firstName} {revokeTarget?.lastName}?
            </DialogTitle>
            <DialogDescription className="text-body text-muted">
              Their interview link stops working immediately. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setRevokeTarget(null)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              className="inline-flex h-9 items-center justify-center rounded-md bg-error px-4 text-button text-error-foreground transition-colors hover:bg-error/90"
            >
              Revoke invite
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EmailCellProps {
  candidate: InviteCandidate;
  editing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

function EmailCell({ candidate, editing, editValue, onEditValueChange, onCommit, onCancel }: EmailCellProps) {
  if (!editing) return <>{candidate.email}</>;
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit();
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full max-w-[220px] rounded border border-border bg-surface px-1.5 py-0.5 text-body-sm"
        aria-label={`Edit email for ${candidate.firstName} ${candidate.lastName}`}
      />
      <button
        type="button"
        onClick={onCommit}
        aria-label="Save email"
        className="flex h-6 w-6 items-center justify-center rounded text-success hover:bg-success-wash"
      >
        <Check size={13} />
      </button>
    </div>
  );
}

interface RowActionsProps {
  candidate: InviteCandidate;
  editingBouncedId: string | null;
  resendingId: string | null;
  cooldownRemaining: number;
  onEditBounced: () => void;
  onResend: () => void;
  onRevoke: () => void;
}

function RowActions({
  candidate: c,
  editingBouncedId,
  resendingId,
  cooldownRemaining: remaining,
  onEditBounced,
  onResend,
  onRevoke,
}: RowActionsProps) {
  return (
    <>
      {c.status === 'bounced' && editingBouncedId !== c.id && (
        <button
          type="button"
          onClick={onEditBounced}
          aria-label={`Edit email and resend for ${c.firstName} ${c.lastName}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading"
        >
          <Pencil size={13} />
        </button>
      )}
      {c.status !== 'revoked' && c.status !== 'queued' && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onResend}
                disabled={remaining > 0 || resendingId === c.id || editingBouncedId === c.id}
                aria-label={`Resend invite for ${c.firstName} ${c.lastName}`}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-card-hover hover:text-heading disabled:pointer-events-none disabled:opacity-40"
              >
                {resendingId === c.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RotateCcw size={13} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {remaining > 0 ? `Wait ${remaining}s before resending again` : 'Resend invite'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {c.status !== 'revoked' && (
        <button
          type="button"
          onClick={onRevoke}
          aria-label={`Revoke invite for ${c.firstName} ${c.lastName}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
        >
          <Ban size={13} />
        </button>
      )}
    </>
  );
}
