'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
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
import { SectionCard } from '@/components/wizard/section-card';
import {
  getInviteReadiness,
  getPlanInfo,
  sendInvites,
  bulkInvite,
  type BulkInviteResult,
} from '@/lib/api/jobs';
import { inviteRowSchema } from '@/lib/validation/job';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

type Readiness = {
  jobDetailsReady: boolean;
  questionCount: number;
  teamCount: number;
  brandingReady: boolean;
};

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job } = useWizard();
  const [readiness, setReadiness] = React.useState<Readiness | null>(null);
  const [plan, setPlan] = React.useState<{ candidateLimit: number; candidatesUsed: number } | null>(null);
  const [rows, setRows] = React.useState<InviteRow[]>([
    { id: genRowId(), firstName: '', lastName: '', email: '' },
  ]);
  const [sending, setSending] = React.useState(false);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkResult, setBulkResult] = React.useState<BulkInviteResult | null>(null);
  const [finishing, setFinishing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!jobId) return;
    getInviteReadiness(jobId).then(setReadiness).catch(() => {});
    getPlanInfo().then((p) => setPlan({ candidateLimit: p.candidateLimit, candidatesUsed: p.candidatesUsed })).catch(() => {});
  }, [jobId]);

  const candidateUrl = job?.candidateUrl ?? '';
  const candidatesRemaining = plan ? plan.candidateLimit - plan.candidatesUsed : 0;
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
      for (let i = 1; i < lines.length && parsed.length < 50; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 3) {
          parsed.push({ firstName: cols[0], lastName: cols[1], email: cols[2] });
        }
      }
      if (parsed.length === 0) {
        toast.error('No valid rows found in the file');
        return;
      }
      if (parsed.length > 50) {
        toast.error('Maximum 50 candidates per upload');
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

  const readinessItems = readiness
    ? [
        { label: 'Job details', ready: readiness.jobDetailsReady, link: '/jobs/new/setup' },
        { label: `${readiness.questionCount} question${readiness.questionCount !== 1 ? 's' : ''} added`, ready: readiness.questionCount > 0, link: jobId ? `/jobs/${jobId}/edit/questions` : '' },
        {
          label:
            readiness.teamCount <= 1
              ? 'No team assigned — only you will be notified about candidate activity'
              : `${readiness.teamCount} team members assigned`,
          ready: readiness.teamCount > 1,
          link: jobId ? `/jobs/${jobId}/edit/teams` : '',
        },
        {
          label: 'Branding not customised — candidates will see the default experience',
          ready: readiness.brandingReady,
          link: jobId ? `/jobs/${jobId}/edit/customisation` : '',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <HeroBanner
        headline="Ready for candidates"
        subtext="Share a link or invite people directly."
        step={5}
      />

      {/* Readiness checklist */}
      {readiness && (
        <SectionCard
          title="Before you invite"
          description="A quick summary of what's set up."
          statusDot={readinessItems.every((i) => i.ready) ? 'success' : 'indigo'}
          statusTooltip={readinessItems.every((i) => i.ready) ? 'Complete' : 'Some items need attention'}
        >
          <ul className="space-y-3">
            {readinessItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                {item.ready ? (
                  <Check size={18} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
                )}
                <span className="text-body-sm text-bodyText">
                  {item.ready ? (
                    item.label
                  ) : (
                    <>
                      {item.label}{' '}
                      {item.link && (
                        <a
                          href={item.link}
                          className="font-medium text-primary hover:underline"
                        >
                          Go to step →
                        </a>
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-body-sm text-muted">
            This job&apos;s link is already live. Anyone with it can apply.
          </p>
        </SectionCard>
      )}

      {/* Share a link */}
      <SectionCard
        title="Share a link"
        description="Share this link on job boards, social media, or your careers page."
        statusDot="success"
        statusTooltip="Complete"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value={candidateUrl}
            className="h-10 flex-1 font-mono text-body-sm"
            aria-label="Interview link"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a
              href={candidateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              <ExternalLink size={14} />
              Preview
            </a>
          </div>
        </div>
      </SectionCard>

      {/* Invite individually */}
      <SectionCard
        title="Invite individually"
        description="Add candidates one by one. Each will receive an email invite."
        statusDot={validCount > 0 ? 'success' : 'indigo'}
        statusTooltip={validCount > 0 ? `${validCount} valid invite${validCount > 1 ? 's' : ''}` : 'No valid invites yet'}
      >
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex-1">
                  <Input
                    value={row.firstName}
                    onChange={(e) => updateRow(row.id, 'firstName', e.target.value)}
                    placeholder="First name"
                    className="h-10"
                    aria-label={`Row ${index + 1} first name`}
                    aria-invalid={!!row.error}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={row.lastName}
                    onChange={(e) => updateRow(row.id, 'lastName', e.target.value)}
                    placeholder="Last name"
                    className="h-10"
                    aria-label={`Row ${index + 1} last name`}
                  />
                </div>
                <div className="flex-[1.5]">
                  <Input
                    value={row.email}
                    onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                    placeholder="Email address"
                    type="email"
                    className="h-10"
                    aria-label={`Row ${index + 1} email`}
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
                <p role="alert" className="mt-1 text-body-sm text-error">
                  {row.error}
                </p>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline"
        >
          <Plus size={14} />
          Add another
        </button>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSendInvites}
            disabled={validCount === 0 || sending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {sending && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            )}
            Send {validCount > 0 && `${validCount} `}invite{validCount !== 1 ? 's' : ''}
          </button>
        </div>
      </SectionCard>

      {/* Invite in bulk */}
      <SectionCard
        title="Invite in bulk"
        description="Upload a CSV or XLSX file with up to 50 candidates."
        statusDot="success"
        statusTooltip="Complete"
      >
        {planLimitReached ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-5">
            <p className="text-body text-heading">
              You&apos;ve reached your plan&apos;s candidate limit ({plan?.candidatesUsed}/{plan?.candidateLimit}).
            </p>
            <a
              href="/dashboard/settings/billing"
              className="mt-2 inline-block text-body-sm font-medium text-primary hover:underline"
            >
              Upgrade your plan →
            </a>
          </div>
        ) : (
          <>
            <p className="mb-4 text-body-sm text-muted">
              Upload a .csv or .xlsx file with up to 50 candidates. {candidatesRemaining} slots remaining.
            </p>

            {bulkLoading ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-6">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-body text-muted">Processing upload…</span>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (fileInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      fileInputRef.current.files = dt.files;
                      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                }}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong p-8 text-center transition-colors hover:border-primary/40"
              >
                <Upload size={24} className="text-muted" />
                <p className="mt-2 text-body text-bodyText">
                  Drag and drop your file here, or
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
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

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const csv = 'First name,Last name,Email\nJane,Smith,jane.smith@example.com\nJohn,Doe,john.doe@example.com\n';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'candidate-template.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline"
            >
              <FileDown size={14} />
              Download sample template
            </a>

            {bulkResult && (
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <p className="text-body text-heading">
                  <span className="font-medium text-success">{bulkResult.invited} invited</span>
                  {bulkResult.failed.length > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-error">{bulkResult.failed.length} failed</span>
                    </>
                  )}
                </p>
                {bulkResult.failed.length > 0 && (
                  <p className="mt-1 text-body-sm text-muted">
                    Failed rows are loaded into the individual form above, each flagged with its specific problem.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </SectionCard>

      <StepFooter
        onCancel={() => jobId && router.push(`/jobs/${jobId}/edit/customisation`)}
        onNext={handleFinish}
        nextLabel="Finish"
        nextLoading={finishing}
      />
    </div>
  );
}
