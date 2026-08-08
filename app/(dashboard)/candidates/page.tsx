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

  // Stage counts drive the summary strip. Computed from everything matching the
  // *other* filters, so the numbers still mean something while a stage is
  // selected — otherwise the chosen stage would read N and the rest zero.
  const stageBase = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (c) =>
        (!job || c.jobTitle === job) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.jobTitle.toLowerCase().includes(q))
    );
  }, [rows, job, query]);

  const stageCounts = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const s of CANDIDATE_STAGES) m.set(s, 0);
    for (const c of stageBase) m.set(c.stage, (m.get(c.stage) ?? 0) + 1);
    return m;
  }, [stageBase]);

  if (loading) return <CandidatesSkeleton />;

  const clearAll = () => {
    setJob('');
    setStage('');
    setQuery('');
  };

  return (
    <>
      <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header + the one Primary action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-h1 text-heading">Candidates</h1>
            <p className="mt-2 text-body text-bodyText">
              Everyone invited to interview, across every job.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {/* Stage strip — a count per stage that doubles as the stage filter.
            Reading the funnel and filtering it are the same gesture. */}
        <div className="mt-6 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
            <StageChip
              label="All"
              count={stageBase.length}
              active={stage === ''}
              onClick={() => setStage('')}
            />
            {CANDIDATE_STAGES.map((s) => (
              <StageChip
                key={s}
                label={s}
                count={stageCounts.get(s) ?? 0}
                active={stage === s}
                onClick={() => setStage(stage === s ? '' : s)}
              />
            ))}
          </div>
        </div>

        {/* Search + job filter on one row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
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
              placeholder="Search by name, email or job"
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-body text-heading placeholder:text-muted transition-colors hover:border-border-strong"
            />
          </div>
          <div className="sm:w-56">
            <label htmlFor="job-filter" className="sr-only">
              Filter by job
            </label>
            <SettingsSelect
              id="job-filter"
              value={job}
              onChange={setJob}
              placeholder="All jobs"
              options={[{ value: '', label: 'All jobs' }, ...jobs.map((j) => ({ value: j, label: j }))]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-body-sm text-muted">
            <span className="font-mono tabular-nums text-heading">{filtered.length}</span>{' '}
            candidate{filtered.length === 1 ? '' : 's'}
            {hasFilters && ` of ${rows.length}`}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded text-body-sm font-medium text-muted transition-colors hover:text-heading"
            >
              <X size={13} />
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-border-strong px-6 py-14 text-center">
            <Users size={20} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-body font-medium text-heading">No candidates found</p>
            <p className="mt-1 text-body-sm text-muted">
              {hasFilters
                ? 'Try clearing your filters or searching for something else.'
                : 'Candidates appear here once you invite them to a job.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-4 inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
              {/* The table needs ~850px of content width. At lg the sidebar is
                  already showing and only ~750px is left, so it would overflow —
                  the card list holds until xl, where there is genuine room. */}
              <table className="hidden w-full xl:table">
                <thead>
                  <tr className="border-b border-border">
                    {['Candidate', 'Job position', 'Stage'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-2.5 text-left text-caption font-medium text-muted"
                      >
                        {h}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-2.5 text-right font-mono text-caption font-medium text-muted">
                      Deadline
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-caption font-medium text-muted">
                      <span className="sr-only">Actions</span>
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
                          <Avatar initials={c.initials} />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-body font-medium text-heading">{c.name}</span>
                            <span className="truncate text-body-sm text-muted">{c.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block truncate text-body-sm text-bodyText">{c.jobTitle}</span>
                        {c.mobile && (
                          <span className="mt-0.5 block font-mono text-caption text-muted">
                            {c.mobile}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StageBadge stage={c.stage} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-body-sm text-muted">
                        {c.jobDeadline}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          candidate={c}
                          onStage={handleStage}
                          onShare={handleShare}
                          onDelete={setDeleteTarget}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="divide-y divide-border xl:hidden">
                {visible.map((c) => (
                  <li key={c.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar initials={c.initials} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium text-heading">{c.name}</p>
                        <p className="truncate text-body-sm text-muted">{c.email}</p>
                      </div>
                      <StageBadge stage={c.stage} />
                    </div>

                    <dl className="mt-3 space-y-1 pl-11">
                      <div className="flex gap-2 text-body-sm">
                        <dt className="shrink-0 text-muted">Job</dt>
                        <dd className="min-w-0 truncate text-bodyText">{c.jobTitle}</dd>
                      </div>
                      <div className="flex gap-2 text-body-sm">
                        <dt className="shrink-0 text-muted">Deadline</dt>
                        <dd className="font-mono text-bodyText">{c.jobDeadline}</dd>
                      </div>
                      {c.mobile && (
                        <div className="flex gap-2 text-body-sm">
                          <dt className="shrink-0 text-muted">Mobile</dt>
                          <dd className="font-mono text-bodyText">{c.mobile}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-3 pl-11">
                      <RowActions
                        candidate={c}
                        onStage={handleStage}
                        onShare={handleShare}
                        onDelete={setDeleteTarget}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-body-sm text-muted">
                  <span className="font-mono tabular-nums">
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}
                  </span>{' '}
                  of <span className="font-mono tabular-nums">{filtered.length}</span>
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

/* ─────────────────────────── Pieces ─────────────────────────── */

function Avatar({ initials }: { initials: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-bg text-caption font-medium text-heading"
      aria-hidden
    >
      {initials}
    </span>
  );
}

function StageBadge({ stage }: { stage: CandidateStage }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-caption font-medium',
        STAGE_TONE[stage]
      )}
    >
      {stage}
    </span>
  );
}

/** A stage count that is also the stage filter. */
function StageChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-body-sm font-medium transition-colors',
        active
          ? 'border-heading bg-primary text-primary-foreground'
          : 'border-border bg-surface text-bodyText hover:bg-card-hover hover:text-heading'
      )}
    >
      {label}
      <span
        className={cn(
          'font-mono text-caption tabular-nums',
          active ? 'text-primary-foreground/70' : 'text-muted'
        )}
      >
        {count}
      </span>
    </button>
  );
}

/** Stage dropdown, share and delete — shared by the table and the card list. */
function RowActions({
  candidate: c,
  onStage,
  onShare,
  onDelete,
}: {
  candidate: CandidateRecord;
  onStage: (c: CandidateRecord, next: CandidateStage) => void;
  onShare: (c: CandidateRecord) => void;
  onDelete: (c: CandidateRecord) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Change stage for ${c.name}`}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border-strong px-2.5 text-body-sm font-medium text-heading transition-colors hover:bg-card-hover"
          >
            Move
            <ChevronDown size={13} className="text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {CANDIDATE_STAGES.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onStage(c, s)}
              className={cn('flex items-center justify-between gap-4', s === c.stage && 'text-primary')}
            >
              {s}
              {s === c.stage && <Check size={14} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        type="button"
        onClick={() => onShare(c)}
        aria-label={`Copy share link for ${c.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading"
      >
        <Share2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(c)}
        aria-label={`Remove ${c.name}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
