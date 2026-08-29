'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Archive, ArrowDown, ArrowUp, Bot, BriefcaseBusiness, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheckBig, CircleX, Copy, EllipsisVertical, Eye, Grid2x2 as Grid2X2, Layers, List, Mic, Pause, Phone, Plus, RotateCcw, Search, Type, Users, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { archivedJobs, activeJobs, type InterviewFormat, type Job, type JobStatus } from '@/lib/jobs-mock';

/* Each tile is one module family from §3.3 — wash background, ink glyph —
   so the strip reads as five distinct measures instead of one blue block. */
const summaryItems = [
  { label: 'Jobs', value: '8', delta: '+12%', direction: 'up', icon: BriefcaseBusiness, tone: 'jobs' },
  { label: 'Candidates', value: '128', delta: '+8%', direction: 'up', icon: Users, tone: 'candidates' },
  { label: 'Review', value: '45', delta: '+15%', direction: 'up', icon: Activity, tone: 'ai' },
  { label: 'Extra stages', value: '19', delta: '+9%', direction: 'up', icon: Layers, tone: 'interviews' },
  { label: 'Hired', value: '12', delta: '+20%', direction: 'up', icon: CircleCheckBig, tone: 'info' },
  { label: 'Rejected', value: '23', delta: '-5%', direction: 'down', icon: CircleX, tone: 'error' },
] as const;

const toneTile: Record<string, string> = {
  jobs: 'bg-jobs-wash text-jobs-ink',
  candidates: 'bg-candidates-wash text-candidates-ink',
  ai: 'bg-ai-wash text-ai-ink',
  info: 'bg-info-wash text-info-ink',
  error: 'bg-error-wash text-error-ink',
  interviews: 'bg-interviews-wash text-interviews-ink',
  reports: 'bg-reports-wash text-reports-ink',
  settings: 'bg-settings-wash text-settings-ink',
};

/* The four interview formats offered by the create-job wizard, with the same
   icons that wizard uses — the tile tells you how a job interviews, and the
   colour keeps the formats distinguishable at a glance. */
const formatMeta: Record<InterviewFormat, { icon: React.ComponentType<{ className?: string }>; label: string; tone: string }> = {
  ai_video: { icon: Video, label: 'AI Video Interview', tone: 'jobs' },
  ai_avatar: { icon: Bot, label: 'AI Avatar Interview', tone: 'ai' },
  ai_voice: { icon: Mic, label: 'AI Voice Interview', tone: 'reports' },
  ai_phone: { icon: Phone, label: 'AI Phone Screening', tone: 'interviews' },
  text: { icon: Type, label: 'Text Interview', tone: 'settings' },
};

const statusStyles: Record<JobStatus, string> = {
  Active: 'text-success-ink',
  Paused: 'text-warning-ink',
  Expired: 'text-muted',
};

const PAGE_SIZES = ['10', '20', '50'] as const;

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-body-sm font-medium', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

function SummaryStrip() {
  return (
    <section aria-label="Jobs summary" className="grid grid-cols-2 rounded-lg border border-border bg-surface lg:grid-cols-3 xl:grid-cols-6">
      {summaryItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              'flex min-w-0 items-center gap-2.5 border-border px-3 py-3 sm:gap-3 sm:px-4 sm:py-4',
              /* One divider rule per breakpoint: a cell draws a left hairline
                 unless it starts a row, and a top hairline unless it sits in
                 the first row. Column counts are 1 / 2 / 3 / 5, so the row
                 position is derived from the index at each breakpoint. */
              index % 2 === 0 ? 'border-l-0' : 'border-l',
              index < 2 ? 'border-t-0' : 'border-t',
              index % 3 === 0 ? 'lg:border-l-0' : 'lg:border-l',
              index < 3 ? 'lg:border-t-0' : 'lg:border-t',
              index === 0 ? 'xl:border-l-0' : 'xl:border-l',
              'xl:border-t-0'
            )}
          >
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11', toneTile[item.tone])}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden={true} />
            </span>
            <div className="min-w-0">
              <p className="text-h2 tabular leading-none text-heading sm:text-h1">{item.value}</p>
              <p className="mt-1.5 truncate text-body-sm text-muted">{item.label}</p>
              <p className={cn('mt-1.5 flex items-center gap-1 text-caption', item.direction === 'down' ? 'text-error-ink' : 'text-success-ink')}>
                {item.direction === 'down' ? <ArrowDown className="h-3 w-3" aria-hidden="true" /> : <ArrowUp className="h-3 w-3" aria-hidden="true" />}
                {item.delta} <span className="hidden truncate font-normal text-muted 2xl:inline">vs last 30 days</span>
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* The stage row is the card's data spine: an equal-width track so every
   job's stages line up down the list, rather than a min-width strip that
   bunched to the left and left the rest of the card empty. */
/* The stage row is the card's data spine. Pipelines are configured per job,
   so the count is variable — the track is built from the job's own stage
   count rather than a fixed grid-cols-N.

   Wide pipelines wrap onto a second row instead of shrinking every cell past
   legibility: the column count is capped per breakpoint, so a 9-stage job
   reads as 5+4 on a tablet rather than nine 40px slivers. Capping at 7 on lg
   also keeps a 9-stage row from colliding with the sidebar. The counts land
   on data-cols-* attributes that `.stage-track` in globals.css resolves into
   both the grid track and the row-start divider rules. */
function stageColumns(total: number) {
  return {
    base: Math.min(total, 3),
    sm: Math.min(total, 5),
    lg: Math.min(total, 7),
    xl: total,
  };
}

function PipelineStages({ job, archived, onSelect }: { job: Job; archived: boolean; onSelect: (job: Job, stage: string) => void }) {
  const columns = stageColumns(job.stages.length);

  return (
    <div
      className="stage-track gap-y-3"
      data-cols={columns.base}
      data-cols-sm={columns.sm}
      data-cols-lg={columns.lg}
      data-cols-xl={columns.xl}
      role="group"
      aria-label={`Pipeline stages for ${job.title}`}
    >
      {job.stages.map((stage) => {
        const content = (
          <span className="flex w-full min-w-0 flex-col items-center gap-1 px-1 py-2 text-center sm:py-1">
            <span className="text-h3 tabular text-heading">{stage.count}</span>
            <span className="w-full truncate text-caption font-normal text-muted" title={stage.label}>{stage.label}</span>
            <span className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', stage.tone)} aria-hidden="true" />
          </span>
        );
        const frame = 'stage-cell flex min-w-0 items-center justify-center rounded-sm';
        return archived ? (
          <div key={stage.label} className={cn(frame, 'opacity-70')} aria-label={`${stage.count} candidates in ${stage.label}`}>{content}</div>
        ) : (
          <button
            key={stage.label}
            type="button"
            onClick={() => onSelect(job, stage.label)}
            aria-label={`${stage.count} candidates in ${stage.label}`}
            className={cn(frame, 'transition-colors hover:bg-surface-2')}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function JobActions({ job, archived, onAction }: { job: Job; archived: boolean; onAction: (action: string, job: Job) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
      {archived ? (
        <Button variant="secondary" size="sm" onClick={() => onAction('restore', job)}><RotateCcw className="h-4 w-4" aria-hidden="true" />Restore</Button>
      ) : (
        <Button variant="secondary" size="sm" className="text-primary-ink max-sm:flex-1" onClick={() => onAction('invite', job)}><Plus className="h-4 w-4" aria-hidden="true" />Invite candidate</Button>
      )}
      {!archived && (
        <Button variant="secondary" size="icon-sm" className="text-primary-ink" aria-label={`Preview ${job.title}`} onClick={() => onAction('preview', job)}>
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {!archived && (
        <Button
          variant="secondary"
          size="icon-sm"
          className="text-warning-ink"
          aria-label={`${job.status === 'Paused' ? 'Reactivate' : 'Pause'} ${job.title}`}
          onClick={() => onAction(job.status === 'Paused' ? 'reactivate' : 'pause', job)}
        >
          {job.status === 'Paused' ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon-sm" aria-label={`More actions for ${job.title}`}><EllipsisVertical className="h-4 w-4" aria-hidden="true" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!archived && <><DropdownMenuItem onSelect={() => onAction('edit', job)}>Edit job</DropdownMenuItem><DropdownMenuItem onSelect={() => onAction('clone', job)}><Copy className="mr-2 h-4 w-4" />Clone job</DropdownMenuItem><DropdownMenuSeparator /></>}
          <DropdownMenuItem onSelect={() => onAction(archived ? 'delete' : 'archive', job)} className={archived ? 'text-error-ink focus:text-error-ink' : ''}>{archived ? <><CircleX className="mr-2 h-4 w-4" />Delete permanently</> : <><Archive className="mr-2 h-4 w-4" />Archive job</>}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function JobCard({ job, archived, view, onAction, onStageSelect }: { job: Job; archived: boolean; view: 'list' | 'grid'; onAction: (action: string, job: Job) => void; onStageSelect: (job: Job, stage: string) => void }) {
  const format = formatMeta[job.format];
  const Icon = format.icon;
  return (
    <article className={cn('group rounded-lg border border-border bg-surface px-4 py-4 transition-colors hover:border-border-hover sm:px-5', view === 'grid' && 'flex h-full flex-col')}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3 xl:items-center">
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', toneTile[format.tone])} title={format.label}>
            <Icon className="h-5 w-5" aria-hidden={true} />
            <span className="sr-only">{format.label}</span>
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-h2 text-heading" title={job.title}>{job.title}</h2>
            <div className="mt-1 flex flex-col gap-y-0.5 text-body-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
              <span className="flex items-center gap-2"><span>{job.mode}</span><span aria-hidden="true">·</span><span className="truncate">{job.location}</span></span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="flex items-center gap-2"><span className="truncate">{format.label}</span><span aria-hidden="true">·</span><StatusBadge status={job.status} /></span>
            </div>
          </div>
        </div>
        <JobActions job={job} archived={archived} onAction={onAction} />
      </div>
      <div className="mt-4"><PipelineStages job={job} archived={archived} onSelect={onStageSelect} /></div>
      <div className="mt-4 flex flex-col gap-y-1.5 border-t border-border pt-3 text-caption font-normal text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />Created on {job.created}</span>
          <span aria-hidden="true" className="text-border-strong">•</span>
          <span>{job.responded} responded</span>
          <span aria-hidden="true" className="text-border-strong">•</span>
          <span className={cn('font-medium', job.responseRate === '100%' ? 'text-success-ink' : 'text-warning-ink')}>{job.responseRate} response rate</span>
        </span>
        <span className="sm:ml-auto">Created by {job.createdBy}</span>
      </div>
    </article>
  );
}

function JobCardSkeleton() {
  return <div aria-hidden="true" className="rounded-lg border border-border bg-surface px-5 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-11 w-11 animate-pulse rounded-lg bg-surface-2" /><div className="space-y-2"><div className="h-4 w-40 animate-pulse rounded-sm bg-surface-2" /><div className="h-3 w-56 animate-pulse rounded-sm bg-surface-2" /></div></div><div className="h-8 w-24 animate-pulse rounded-sm bg-surface-2" /></div><div className="mt-4 h-16 animate-pulse rounded-md bg-surface-2" /><div className="mt-4 h-4 w-2/3 animate-pulse rounded-sm bg-surface-2" /></div>;
}

/* Explicit pages rather than "load more" — a recruiter scanning a long
   list needs to jump back to page 1, which an append-only list can't do. */
function Pagination({ page, pageCount, pageSize, from, to, total, onPage, onPageSize }: { page: number; pageCount: number; pageSize: string; from: number; to: number; total: number; onPage: (page: number) => void; onPageSize: (size: string) => void }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm text-muted">Showing {from} to {to} of {total} jobs</p>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={pageSize} onValueChange={onPageSize}>
          <SelectTrigger className="h-9 w-36" aria-label="Jobs per page"><SelectValue /></SelectTrigger>
          <SelectContent>{PAGE_SIZES.map((size) => <SelectItem key={size} value={size}>{size} per page</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon-sm" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
          {pages.map((item) => (
            <Button key={item} variant={item === page ? 'default' : 'secondary'} size="icon-sm" aria-label={`Page ${item}`} aria-current={item === page ? 'page' : undefined} onClick={() => onPage(item)}>{item}</Button>
          ))}
          <Button variant="secondary" size="icon-sm" aria-label="Next page" disabled={page === pageCount} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ archived, firstTime, onCreate }: { archived: boolean; firstTime?: boolean; onCreate: () => void }) {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-jobs-wash text-jobs-ink"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-h2 text-heading">{firstTime ? 'Create your first job' : archived ? 'No archived jobs' : 'No active jobs'}</h2><p className="mt-2 max-w-md text-body text-muted">{firstTime ? 'Set up an opening and start bringing candidates into one clear interview pipeline.' : archived ? 'Jobs you archive will appear here when you are ready to keep them out of the active list.' : 'Create a new job to start collecting candidates and tracking progress.'}</p><Button className="mt-6" onClick={onCreate}><Plus className="h-4 w-4" aria-hidden="true" />{firstTime || !archived ? 'Create new job' : 'Back to active jobs'}</Button></div>;
}

export default function OverviewPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<'active' | 'archived'>('active');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('Last 30 days');
  const [sort, setSort] = React.useState('updated');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [loading, setLoading] = React.useState(true);
  const [pageSize, setPageSize] = React.useState('10');
  const [page, setPage] = React.useState(1);
  const [dialog, setDialog] = React.useState<{ action: string; job: Job } | null>(null);

  React.useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 700); return () => window.clearTimeout(timer); }, []);
  React.useEffect(() => { setPage(1); }, [tab, search, status, sort, pageSize]);

  const jobs = tab === 'active' ? activeJobs : archivedJobs;
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.location} ${job.department}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || job.status === status);
  });
  const sortedJobs = [...filteredJobs].sort((a, b) => sort === 'candidates' ? b.candidates - a.candidates : sort === 'oldest' ? a.created.localeCompare(b.created) : b.created.localeCompare(a.created));
  const perPage = Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(sortedJobs.length / perPage));
  const safePage = Math.min(page, pageCount);
  const shownJobs = sortedJobs.slice((safePage - 1) * perPage, safePage * perPage);

  function handleAction(action: string, job: Job) {
    if (['pause', 'reactivate', 'archive', 'restore', 'delete', 'clone'].includes(action)) setDialog({ action, job });
    else if (action === 'preview') toast('Interview preview opened');
    else if (action === 'invite') toast('Invite flow opened');
    else toast(`${action === 'edit' ? 'Edit' : 'Action'} opened for ${job.title}`);
  }

  function confirmAction() {
    if (!dialog) return;
    const labels: Record<string, string> = { pause: 'Job paused', reactivate: 'Job reactivated', archive: 'Job archived', restore: 'Job restored', delete: 'Job deleted', clone: 'Job cloned' };
    toast(labels[dialog.action]);
    setDialog(null);
  }

  const dialogCopy: Record<string, { title: string; description: string; confirm: string; destructive?: boolean }> = {
    pause: { title: 'Pause this job?', description: 'This job will stop accepting new activity. You can reactivate it later.', confirm: 'Pause job' },
    reactivate: { title: 'Reactivate this job?', description: 'This will reopen the job for candidates. Set a new deadline after reactivating.', confirm: 'Reactivate job' },
    archive: { title: 'Archive this job?', description: 'The job will move out of your active list and can be restored later.', confirm: 'Archive job' },
    restore: { title: 'Restore this job?', description: 'The job will move back into your active jobs.', confirm: 'Restore job' },
    delete: { title: 'Delete this job permanently?', description: 'This cannot be undone. The job and its data will be removed.', confirm: 'Delete permanently', destructive: true },
    clone: { title: 'Clone this job?', description: 'A new draft will be created with the same interview setup.', confirm: 'Clone job' },
  };
  const copy = dialog ? dialogCopy[dialog.action] : null;
  const handleStageSelect = (job: Job, stage: string) => router.push(`/jobs/${job.id}?stage=${encodeURIComponent(stage)}`);

  const tabs = [
    { key: 'active' as const, label: 'Active jobs', count: activeJobs.length },
    { key: 'archived' as const, label: 'Archived jobs', count: archivedJobs.length },
  ];

  return (
    <div className="bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-display text-heading">Jobs</h1>
            <p className="mt-1 text-body-lg text-muted">Manage your job openings and track candidate progress.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button onClick={() => toast('Create new job opened')}><Plus className="h-4 w-4" aria-hidden="true" />Create new job</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary"><Calendar className="h-4 w-4 text-muted" aria-hidden="true" />{dateRange}<ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time'].map((range) => <DropdownMenuItem key={range} onSelect={() => setDateRange(range)}>{range}{dateRange === range && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="mt-6"><SummaryStrip /></div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-6" role="tablist" aria-label="Job views">
            {tabs.map((item) => {
              const selected = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(item.key)}
                  className={cn('-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-button transition-colors', selected ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading')}
                >
                  {item.label}
                  <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption', selected ? 'bg-primary-soft text-primary-ink' : 'bg-surface-2 text-muted')}>{item.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs by title, location or department..." aria-label="Search jobs" className="pl-9" />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Paused">Paused</SelectItem><SelectItem value="Expired">Expired</SelectItem></SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-56" aria-label="Sort jobs"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent><SelectItem value="updated">Sort by: Recently updated</SelectItem><SelectItem value="oldest">Sort by: Oldest</SelectItem><SelectItem value="candidates">Sort by: Most candidates</SelectItem></SelectContent>
            </Select>
            {/* The two-up grid needs width a phone does not have, so the view
                toggle is desktop-only and mobile always renders the list. */}
            <div className="ml-auto hidden items-center gap-1 md:flex">
              <Button variant={view === 'list' ? 'default' : 'secondary'} size="icon" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List className="h-4 w-4" aria-hidden="true" /></Button>
              <Button variant={view === 'grid' ? 'default' : 'secondary'} size="icon" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
          </div>
        </div>

        <div className="mt-4" aria-live="polite">
          {loading ? (
            <div className="space-y-3"><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /></div>
          ) : sortedJobs.length === 0 ? (
            search || status !== 'all' ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center">
                <CircleAlert className="h-6 w-6 text-muted" aria-hidden="true" />
                <h2 className="mt-3 text-h2 text-heading">No jobs match your search</h2>
                <p className="mt-2 text-body text-muted">Try a different search or clear the filters.</p>
                <Button variant="secondary" className="mt-5" onClick={() => { setSearch(''); setStatus('all'); }}>Clear filters</Button>
              </div>
            ) : (
              <EmptyState archived={tab === 'archived'} onCreate={() => toast('Create new job opened')} />
            )
          ) : (
            <div className={cn(view === 'grid' ? 'grid gap-3 xl:grid-cols-2' : 'space-y-3')}>
              {shownJobs.map((job) => <JobCard key={job.id} job={job} archived={tab === 'archived'} view={view} onAction={handleAction} onStageSelect={handleStageSelect} />)}
            </div>
          )}
        </div>

        {!loading && sortedJobs.length > 0 && (
          <Pagination
            page={safePage}
            pageCount={pageCount}
            pageSize={pageSize}
            from={(safePage - 1) * perPage + 1}
            to={(safePage - 1) * perPage + shownJobs.length}
            total={sortedJobs.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        )}
      </div>
      <Button className="fixed bottom-6 right-6 z-sticky h-12 w-12 rounded-full p-0 shadow-lg sm:hidden" aria-label="Create new job" onClick={() => toast('Create new job opened')}><Plus className="h-5 w-5" aria-hidden="true" /></Button>
      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{copy?.title}</DialogTitle><DialogDescription>{copy?.description}</DialogDescription></DialogHeader><DialogFooter><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button variant={copy?.destructive ? 'destructive' : 'default'} onClick={confirmAction}>{copy?.confirm}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
