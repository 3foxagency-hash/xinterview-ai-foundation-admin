'use client';

import * as React from 'react';
import { Check, ChevronDown, Download, Search, Share2, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { SettingsSelect } from '@/components/settings/settings-select';
import { DeleteCandidateDialog } from '@/components/candidates/delete-candidate-dialog';
import { CandidatesSkeleton } from '@/components/candidates/candidates-skeleton';
import {
  getCandidates,
  getJobTitles,
  updateCandidateStage,
  deleteCandidate,
  candidateShareLink,
  toCsv,
  CANDIDATE_STAGES,
  type CandidateRecord,
  type CandidateStage,
} from '@/lib/api/candidates';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';

const STAGE_TONE: Record<CandidateStage, string> = {
  Invited: 'border-border bg-muted-bg text-bodyText',
  'In progress': 'border-info/30 bg-info/10 text-info',
  Review: 'border-warning/30 bg-warning/10 text-warning',
  Shortlisted: 'border-primary/30 bg-active-menu-bg text-primary',
  'Live interview': 'border-primary/30 bg-active-menu-bg text-primary',
  Hired: 'border-success/30 bg-success/10 text-success',
  Rejected: 'border-error/30 bg-error/10 text-error',
};

const PAGE_SIZE = 8;

export default function CandidatesPage() {
  const [rows, setRows] = React.useState<CandidateRecord[]>([]);
  const [jobs, setJobs] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [job, setJob] = React.useState('');
  const [stage, setStage] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = React.useState<CandidateRecord | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, j] = await Promise.all([getCandidates(), getJobTitles()]);
        if (cancelled) return;
        setRows(c);
        setJobs(j);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (c) =>
        (!job || c.jobTitle === job) &&
        (!stage || c.stage === stage) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.jobTitle.toLowerCase().includes(q))
    );
  }, [rows, job, stage, query]);

  // Snap back to the first page whenever the filters change the result set.
  React.useEffect(() => setPage(0), [job, stage, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = !!job || !!stage || !!query.trim();

  const handleStage = async (c: CandidateRecord, next: CandidateStage) => {
    try {
      const updated = await updateCandidateStage(c.id, next);
      setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(`${updated.name} moved to ${next}`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCandidate(deleteTarget.id);
      setRows((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} removed`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleShare = async (c: CandidateRecord) => {
    try {
      await navigator.clipboard.writeText(candidateShareLink(c.id));
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} candidate${filtered.length === 1 ? '' : 's'}`);
  };

  if (loading) return <CandidatesSkeleton />;

  return (
    <>
      <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-h1 text-heading">Candidates</h1>
        <p className="mt-2 text-body text-bodyText">
          Everyone who has been invited to interview, across every job.
        </p>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <SettingsSelect
              label="Job position"
              value={job}
              onChange={setJob}
              placeholder="All jobs"
              options={[{ value: '', label: 'All jobs' }, ...jobs.map((j) => ({ value: j, label: j }))]}
            />
            <SettingsSelect
              label="Stage"
              value={stage}
              onChange={setStage}
              placeholder="All stages"
              options={[
                { value: '', label: 'All stages' },
                ...CANDIDATE_STAGES.map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <div className="relative sm:w-56">
              <label htmlFor="candidate-search" className="sr-only">
                Search candidates
              </label>
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="candidate-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search candidates"
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-body text-heading placeholder:text-muted transition-all hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
              />
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-body-sm text-muted">
            {filtered.length} candidate{filtered.length === 1 ? '' : 's'}
            {hasFilters && ` of ${rows.length}`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setJob('');
                setStage('');
                setQuery('');
              }}
              className="inline-flex items-center gap-1 rounded text-body-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-12 text-center">
            <Users size={24} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-body text-heading">No candidates found</p>
            <p className="mt-1 text-body-sm text-muted">
              {hasFilters
                ? 'Try clearing your filters or searching for something else.'
                : 'Candidates appear here once you invite them to a job.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-border bg-muted-bg">
                    {['Candidate', 'Job position', 'Mobile', 'Stage', 'Job deadline'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-2.5 text-left text-caption font-medium text-muted"
                      >
                        {h}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-right text-caption font-medium text-muted"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn('transition-colors hover:bg-card-hover', i > 0 && 'border-t border-border')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-semibold text-primary">
                            {c.initials}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-body font-medium text-heading">{c.name}</span>
                            <span className="truncate text-body-sm text-muted">{c.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-bodyText">{c.jobTitle}</td>
                      <td className="px-4 py-3 text-body-sm text-muted">{c.mobile ?? 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-caption font-medium',
                            STAGE_TONE[c.stage]
                          )}
                        >
                          {c.stage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-body-sm text-muted">
                        {c.jobDeadline}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={`Change stage for ${c.name}`}
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-border-strong px-2.5 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                Move
                                <ChevronDown size={13} className="text-muted" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {CANDIDATE_STAGES.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => handleStage(c, s)}
                                  className={cn(
                                    'flex items-center justify-between gap-4',
                                    s === c.stage && 'text-primary'
                                  )}
                                >
                                  {s}
                                  {s === c.stage && <Check size={14} />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <button
                            type="button"
                            onClick={() => handleShare(c)}
                            aria-label={`Copy share link for ${c.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Remove ${c.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-body-sm text-muted">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
                  {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="inline-flex h-9 items-center rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="inline-flex h-9 items-center rounded-md border border-border-strong px-3 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <DeleteCandidateDialog
          open={!!deleteTarget}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          candidateName={deleteTarget.name}
          jobTitle={deleteTarget.jobTitle}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
