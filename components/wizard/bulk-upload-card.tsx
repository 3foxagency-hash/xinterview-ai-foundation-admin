'use client';

import * as React from 'react';
import { Upload, FileDown, ChevronDown, TriangleAlert as AlertTriangle, Loader as Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';
import { Input } from '@/components/ui/input';
import { validateInviteCsv, MAX_CSV_ROWS, type CsvInviteRow, type CsvInvalidRow } from '@/lib/validation/csv-invites';
import { emailSchema } from '@/lib/validation/auth';
import { addInviteCandidates, type InviteCandidate, type CustomField } from '@/lib/api/invites';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

interface BulkUploadCardProps {
  id?: string;
  jobId: string;
  candidates: InviteCandidate[];
  customFields: CustomField[];
  onCandidatesChanged: (candidates: InviteCandidate[]) => void;
}

type Row = { id: string; firstName: string; lastName: string; email: string; field?: CsvInvalidRow['field']; reason?: string };

function genRowId() {
  return `csvrow_${Math.random().toString(36).slice(2, 10)}`;
}

function toRow(r: CsvInviteRow | CsvInvalidRow, invalid: boolean): Row {
  return {
    id: genRowId(),
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    ...(invalid && 'reason' in r ? { field: r.field, reason: r.reason } : {}),
  };
}

const MAX_FILE_SIZE_MB = 2;

export function BulkUploadCard({ id, jobId, candidates, customFields: _customFields, onCandidatesChanged }: BulkUploadCardProps) {
  const { setSaveState } = useWizard();
  const [stage, setStage] = React.useState<'idle' | 'processing' | 'reviewing'>('idle');
  const [validRows, setValidRows] = React.useState<Row[]>([]);
  const [invalidRows, setInvalidRows] = React.useState<Row[]>([]);
  const [skippedCount, setSkippedCount] = React.useState(0);
  const [validListOpen, setValidListOpen] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const announceRef = React.useRef<HTMLDivElement>(null);

  const existingEmails = React.useMemo(
    () => new Set(candidates.map((c) => c.email.toLowerCase())),
    [candidates]
  );

  const handleDownloadTemplate = () => {
    const headerCols = ['First name', 'Last name', 'Email', ..._customFields.map((f) => f.label)];
    const csv = `${headerCols.join(',')}\nJane,Smith,jane.smith@example.com\nJohn,Doe,john.doe@example.com\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidate-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a .csv file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`This file is larger than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    setStage('processing');
    track('bulk_upload_started', {});
    try {
      const text = await file.text();
      const result = validateInviteCsv(text, existingEmails);
      setValidRows(result.valid.map((r) => toRow(r, false)));
      setInvalidRows(result.invalid.map((r) => toRow(r, true)));
      setSkippedCount(result.skippedCount);
      setStage('reviewing');
      track('bulk_upload_validated', {
        valid: result.valid.length,
        invalid: result.invalid.length,
        skipped: result.skippedCount,
      });
      if (announceRef.current) {
        announceRef.current.textContent = `${result.valid.length} valid, ${result.invalid.length} need attention.`;
      }
    } catch {
      toast.error('Could not read this file.');
      setStage('idle');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const revalidateRow = (row: Row): Row => {
    if (!row.firstName.trim()) return { ...row, field: 'firstName', reason: 'First name is required' };
    if (!row.lastName.trim()) return { ...row, field: 'lastName', reason: 'Last name is required' };
    const emailResult = emailSchema.safeParse(row.email);
    if (!emailResult.success) {
      return { ...row, field: 'email', reason: row.email ? 'Not a valid email address' : 'Email is required' };
    }
    const normalized = emailResult.data.toLowerCase();
    if (existingEmails.has(normalized)) {
      return { ...row, field: 'email', reason: 'This email is already invited' };
    }
    const dupInValid = validRows.some((r) => r.id !== row.id && r.email.toLowerCase() === normalized);
    const dupInInvalid = invalidRows.some((r) => r.id !== row.id && r.email.toLowerCase() === normalized);
    if (dupInValid || dupInInvalid) {
      return { ...row, field: 'email', reason: 'Duplicate email within this file' };
    }
    return { id: row.id, firstName: row.firstName, lastName: row.lastName, email: emailResult.data };
  };

  const updateInvalidRow = (rowId: string, patch: Partial<Row>) => {
    setInvalidRows((prev) => {
      const updated = prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r));
      const target = updated.find((r) => r.id === rowId)!;
      const revalidated = revalidateRow(target);
      if (!revalidated.reason) {
        // Now valid — move it to the valid list.
        setValidRows((v) => [...v, revalidated]);
        return updated.filter((r) => r.id !== rowId);
      }
      return updated.map((r) => (r.id === rowId ? revalidated : r));
    });
  };

  const removeInvalidRow = (rowId: string) => {
    setInvalidRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setSaveState('saving');
    try {
      const added = await addInviteCandidates(
        jobId,
        'bulk',
        validRows.map((r) => ({ firstName: r.firstName, lastName: r.lastName, email: r.email }))
      );
      onCandidatesChanged([...candidates, ...added]);
      track('bulk_upload_imported', { count: added.length });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
      toast.success(`Added ${added.length} ${added.length === 1 ? 'candidate' : 'candidates'}`);
      setStage('idle');
      setValidRows([]);
      setInvalidRows([]);
      setSkippedCount(0);
    } catch {
      setSaveState('error');
      toast.error('Could not import these candidates');
    } finally {
      setImporting(false);
    }
  };

  const handleStartOver = () => {
    setStage('idle');
    setValidRows([]);
    setInvalidRows([]);
    setSkippedCount(0);
  };

  return (
    <div id={id} className="scroll-mt-4 rounded-lg border border-border bg-surface p-5">
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-h3 text-heading">
            <Upload size={16} className="text-muted" />
            Bulk upload
          </h3>
          <p className="mt-1 text-body-sm text-muted">
            Upload a CSV and invite up to {MAX_CSV_ROWS} candidates at once.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownloadTemplate}
        className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-medium text-heading transition-colors hover:text-muted"
      >
        <FileDown size={14} />
        Download template
      </button>

      {stage === 'idle' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload a CSV file, or press Enter to choose a file"
          className={cn(
            'mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragActive ? 'border-primary bg-active-menu-bg' : 'border-border-strong hover:bg-card-hover'
          )}
        >
          <Upload size={20} className="text-muted" />
          <p className="mt-3 text-body font-medium text-heading">Drop a .csv file here</p>
          <p className="mt-1 text-body-sm text-muted">
            CSV only · up to {MAX_CSV_ROWS} rows · {MAX_FILE_SIZE_MB}MB max
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Choose file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      )}

      {stage === 'processing' && (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-border p-6">
          <Loader2 size={20} className="animate-spin text-muted" />
          <span className="text-body text-muted">Checking your file…</span>
        </div>
      )}

      {stage === 'reviewing' && (
        <div className="mt-4 space-y-4">
          {/* Valid rows */}
          {validRows.length > 0 && (
            <div className="rounded-md border border-success-border bg-success-wash">
              <button
                type="button"
                onClick={() => setValidListOpen((v) => !v)}
                aria-expanded={validListOpen}
                className="flex h-11 w-full items-center gap-2 px-3 text-body-sm font-medium text-success-ink"
              >
                <ChevronDown size={14} className={cn('transition-transform', validListOpen && 'rotate-180')} />
                {validRows.length} valid {validRows.length === 1 ? 'row' : 'rows'}
              </button>
              {validListOpen && (
                <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-success-border px-3 py-2">
                  {validRows.map((r) => (
                    <li key={r.id} className="text-body-sm text-heading">
                      {r.firstName} {r.lastName} <span className="text-muted">— {r.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Invalid rows — editable */}
          {invalidRows.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-body-sm font-medium text-error-ink">
                <AlertTriangle size={14} />
                {invalidRows.length} {invalidRows.length === 1 ? 'row needs' : 'rows need'} attention
              </p>
              <div className="space-y-2">
                {invalidRows.map((r) => (
                  <div key={r.id} className="rounded-md border border-error-border bg-error-wash p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <Input
                        value={r.firstName}
                        onChange={(e) => updateInvalidRow(r.id, { firstName: e.target.value })}
                        placeholder="First name"
                        className={cn('h-9', r.field === 'firstName' && 'border-error')}
                        aria-label={`First name for row: ${r.email || 'new row'}`}
                        aria-invalid={r.field === 'firstName'}
                      />
                      <Input
                        value={r.lastName}
                        onChange={(e) => updateInvalidRow(r.id, { lastName: e.target.value })}
                        placeholder="Last name"
                        className={cn('h-9', r.field === 'lastName' && 'border-error')}
                        aria-label={`Last name for row: ${r.email || 'new row'}`}
                        aria-invalid={r.field === 'lastName'}
                      />
                      <Input
                        value={r.email}
                        onChange={(e) => updateInvalidRow(r.id, { email: e.target.value })}
                        placeholder="Email address"
                        className={cn('h-9 flex-[1.3]', r.field === 'email' && 'border-error')}
                        aria-label={`Email for row: ${r.firstName} ${r.lastName}`}
                        aria-invalid={r.field === 'email'}
                      />
                      <button
                        type="button"
                        onClick={() => removeInvalidRow(r.id)}
                        aria-label={`Discard row for ${r.firstName} ${r.lastName || r.email}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p role="alert" className="mt-1.5 text-caption text-error-ink">
                      {r.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skippedCount > 0 && (
            <p className="text-body-sm text-muted">
              {skippedCount} more {skippedCount === 1 ? 'row was' : 'rows were'} skipped — this
              upload only takes the first {MAX_CSV_ROWS}. Upload the rest separately.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={validRows.length === 0 || importing}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
            >
              {importing && <Loader2 size={14} className="animate-spin" />}
              Add {validRows.length} {validRows.length === 1 ? 'candidate' : 'candidates'}
            </button>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-body-sm font-medium text-muted transition-colors hover:text-heading"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
