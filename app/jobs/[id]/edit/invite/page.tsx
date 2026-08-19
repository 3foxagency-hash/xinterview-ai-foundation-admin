'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Check,
  Copy,
  Eye,
  Plus,
  X,
  Upload,
  FileDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { HeroBanner } from '@/components/wizard/hero-banner';
import { SegmentedControl } from '@/components/settings/segmented-control';
import {
  getPlanInfo,
  sendInvites,
  bulkInvite,
  type BulkInviteResult,
} from '@/lib/api/jobs';
import { inviteRowSchema } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { CandidatePreviewDialog } from '@/components/wizard/candidate-preview-dialog';

type InviteRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  error?: string;
};

function genRowId() {
  return `row_${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_BULK_ROWS = 50;

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job, loading: jobLoading } = useWizard();
  const [mode, setMode] = React.useState<'individual' | 'bulk'>('individual');
  const [plan, setPlan] = React.useState<{ candidateLimit: number; candidatesUsed: number } | null>(null);
  const [rows, setRows] = React.useState<InviteRow[]>([
    { id: genRowId(), firstName: '', lastName: '', email: '' },
  ]);
  const [sending, setSending] = React.useState(false);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState<BulkInviteResult | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!jobId) return;
    getPlanInfo().then((p) => setPlan({ candidateLimit: p.candidateLimit, candidatesUsed: p.candidatesUsed })).catch(() => {});
  }, [jobId]);

  // Falls back to the deterministic public URL so a direct page load still
  // shows something useful while the job record is loading (or if it can't be
  // fetched at all).
  const candidateUrl =
    job?.candidateUrl ?? (jobId ? `https://xinterview.ai/interview/${jobId}` : '');
  const linkReady = !!candidateUrl && !jobLoading;
  const planLimitReached = plan ? plan.candidatesUsed >= plan.candidateLimit : false;

  const validRows = rows.filter((r) => {
    const result = inviteRowSchema.safeParse({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
    });
    return result.success;
  });
  const validCount = validRows.length;
  const hasAnyInput = rows.some(
    (r) => r.firstName.trim() || r.lastName.trim() || r.email.trim()
  );

  const updateRow = (id: string, field: keyof InviteRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value, error: undefined } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { id: genRowId(), firstName: '', lastName: '', email: '' }]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const validateRow = (row: InviteRow): string | null => {
    if (!row.firstName.trim()) return 'First name is required';
    if (!row.lastName.trim()) return 'Last name is required';
    const result = inviteRowSchema.shape.email.safeParse(row.email);
    if (!result.success) return result.error.errors[0]?.message ?? 'Enter a valid email';
    return null;
  };

  const handleSendInvites = async () => {
    if (!jobId) return;
    const errors: InviteRow[] = rows.map((r) => ({ ...r, error: validateRow(r) ?? undefined }));
    const hasErrors = errors.some((e) => e.error);
    if (hasErrors) {
      setRows(errors);
      toast.error('Please fix the errors before sending');
      return;
    }
    setSending(true);
    try {
      const invites = rows.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
      }));
      await sendInvites(jobId, invites);
      track('candidate_invited', { count: invites.length });
      toast.success(`Sent ${invites.length} invite${invites.length > 1 ? 's' : ''}`);
      setRows([{ id: genRowId(), firstName: '', lastName: '', email: '' }]);
    } catch {
      toast.error('Could not send invites');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(candidateUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !jobId) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      const parsed: { firstName: string; lastName: string; email: string }[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 3) {
          parsed.push({ firstName: cols[0], lastName: cols[1], email: cols[2] });
        }
      }
      if (parsed.length === 0) {
        toast.error('No valid rows found in the file');
        return;
      }
      // Previously the parse loop stopped at 50, so this check could never fire
      // and extra rows were dropped silently.
      if (parsed.length > MAX_BULK_ROWS) {
        toast.error(
          `This file has ${parsed.length} candidates. The maximum is ${MAX_BULK_ROWS} per upload.`
        );
        return;
      }
      const result = await bulkInvite(jobId, parsed);
      setBulkResult(result);
      track('candidates_bulk_invited', { invited: result.invited, failed: result.failed.length });
      if (result.failed.length > 0) {
        track('bulk_invite_partial_failure', { failed: result.failed.length });
      }
      if (result.failed.length > 0) {
        const failedRows: InviteRow[] = result.failed.map((f) => ({
          id: genRowId(),
          firstName: f.firstName,
          lastName: f.lastName,
          email: f.email,
          error: f.reason,
        }));
        setRows(failedRows);
        toast.error(`${result.failed.length} row${result.failed.length > 1 ? 's' : ''} need attention — loaded below for fixing`);
      }
    } catch {
      toast.error('Could not process the file');
    } finally {
      setBulkLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFinish = () => {
    if (!jobId) return;
    setFinishing(true);
    setTimeout(() => {
      setFinishing(false);
      router.push(`/jobs/${jobId}`);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <HeroBanner
        headline="Ready for candidates"
        subtext="Share a link or invite people directly."
        step={5}
      />

      {/* The link is the primary artefact of this step — it is already live, so
          it leads rather than sitting below the invite forms. */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-heading">Your interview link</h3>
            <p className="mt-1 text-body-sm text-muted">
              Live now — anyone with this link can apply.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-caption font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Live
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value={linkReady ? candidateUrl : ''}
            placeholder={linkReady ? undefined : 'Loading link…'}
            className="h-10 min-w-0 flex-1 font-mono text-body-sm"
            aria-label="Interview link"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!linkReady}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!linkReady}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
            >
              <Eye size={14} />
              Preview
            </button>
          </div>
        </div>
      </section>

      {/* Individual and bulk are two routes to the same outcome, so they are a
          choice rather than two stacked sections to scroll past. */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-h3 text-heading">Invite candidates</h3>
            <p className="mt-1 text-body-sm text-muted">
              They will each receive an email with the link.
            </p>
          </div>
          <div className="w-full sm:w-[260px]">
            <SegmentedControl
              options={[
                { value: 'individual', label: 'One by one' },
                { value: 'bulk', label: 'Upload a file' },
              ]}
              value={mode}
              onChange={(v) => setMode(v as 'individual' | 'bulk')}
            />
          </div>
        </div>

        {planLimitReached && (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-4">
            <p className="text-body-sm text-heading">
              You&apos;ve reached your plan&apos;s candidate limit ({plan?.candidatesUsed}/
              {plan?.candidateLimit}).
            </p>
            <a
              href="/settings/billing"
              className="mt-1 inline-block text-body-sm font-medium text-heading underline underline-offset-4"
            >
              Upgrade your plan
            </a>
          </div>
        )}

        {mode === 'individual' ? (
          <div className="mt-5">
            {/* Column headers — the inputs are placeholder-only, which disappears
                once a row is filled in. */}
            <div className="mb-2 hidden gap-2 sm:flex">
              <span className="flex-1 text-caption font-medium text-muted">First name</span>
              <span className="flex-1 text-caption font-medium text-muted">Last name</span>
              <span className="flex-[1.5] text-caption font-medium text-muted">Email address</span>
              <span className="w-10 shrink-0" aria-hidden />
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={row.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="flex-1">
                      <Input
                        value={row.firstName}
                        onChange={(e) => updateRow(row.id, 'firstName', e.target.value)}
                        placeholder="First name"
                        className={cn('h-10', row.error && 'border-error')}
                        aria-label={`Row ${index + 1} first name`}
                        aria-invalid={!!row.error}
                        aria-describedby={row.error ? `${row.id}-error` : undefined}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={row.lastName}
                        onChange={(e) => updateRow(row.id, 'lastName', e.target.value)}
                        placeholder="Last name"
                        className={cn('h-10', row.error && 'border-error')}
                        aria-label={`Row ${index + 1} last name`}
                        aria-invalid={!!row.error}
                        aria-describedby={row.error ? `${row.id}-error` : undefined}
                      />
                    </div>
                    <div className="flex-[1.5]">
                      <Input
                        value={row.email}
                        onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                        placeholder="Email address"
                        type="email"
                        className={cn('h-10', row.error && 'border-error')}
                        aria-label={`Row ${index + 1} email`}
                        aria-invalid={!!row.error}
                        aria-describedby={row.error ? `${row.id}-error` : undefined}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      aria-label={`Remove row ${index + 1}`}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error disabled:pointer-events-none disabled:opacity-30"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {row.error && (
                    <p id={`${row.id}-error`} role="alert" className="mt-1 text-body-sm text-error">
                      {row.error}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-heading transition-colors hover:text-muted"
            >
              <Plus size={14} />
              Add another
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              {/* Stays enabled while rows are only partly filled — handleSendInvites
                  validates and surfaces per-row errors. Disabling it here left the
                  user with a dead button and no explanation of what was wrong. */}
              <button
                type="button"
                onClick={handleSendInvites}
                disabled={!hasAnyInput || sending}
                aria-busy={sending}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                {sending && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                )}
                {sending
                  ? 'Sending…'
                  : `Send ${validCount > 0 ? `${validCount} ` : ''}invite${validCount !== 1 ? 's' : ''}`}
              </button>
              {!hasAnyInput && (
                <span className="text-body-sm text-muted">Add a candidate to send an invite.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            {bulkLoading ? (
              <div className="flex items-center gap-3 rounded-md border border-border p-6">
                <Loader2 size={20} className="animate-spin text-muted" />
                <span className="text-body text-muted">Processing upload…</span>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                    fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
                className="flex flex-col items-center justify-center rounded-md border border-dashed border-border-strong px-6 py-10 text-center transition-colors hover:bg-card-hover"
              >
                <Upload size={20} className="text-muted" />
                <p className="mt-3 text-body font-medium text-heading">
                  Drop a .csv or .xlsx file here
                </p>
                <p className="mt-1 text-body-sm text-muted">
                  Columns: first name, last name, email.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
                >
                  Choose file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const csv =
                  'First name,Last name,Email\nJane,Smith,jane.smith@example.com\nJohn,Doe,john.doe@example.com\n';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'candidate-template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-heading transition-colors hover:text-muted"
            >
              <FileDown size={14} />
              Download sample template
            </button>

            {bulkResult && (
              <div className="mt-4 rounded-md border border-border p-4">
                <p className="text-body text-heading">
                  <span className="font-medium text-success">{bulkResult.invited} invited</span>
                  {bulkResult.failed.length > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-error">
                        {bulkResult.failed.length} failed
                      </span>
                    </>
                  )}
                </p>
                {bulkResult.failed.length > 0 && (
                  <p className="mt-1 text-body-sm text-muted">
                    Failed rows are loaded into the one-by-one form, each flagged with its
                    specific problem.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <StepFooter
        onCancel={() => jobId && router.push(`/jobs/${jobId}/edit/customisation`)}
        onNext={handleFinish}
        nextLabel="Finish"
        nextLoading={finishing}
      />

      <CandidatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} jobTitle={job?.title} />
    </div>
  );
}
