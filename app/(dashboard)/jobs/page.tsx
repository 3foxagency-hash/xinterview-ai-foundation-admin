'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArrowDown, ArrowUp, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Copy, Eye, Filter, Grid2x2 as Grid2X2, List, MoveHorizontal as MoreHorizontal, Pause, Plus, RotateCcw, Search, SlidersHorizontal, UserRoundPlus, Users, X } from 'lucide-react';
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
import { archivedJobs, activeJobs, type Job, type JobStatus } from '@/lib/jobs-mock';

const summaryItems = [
  { label: 'Jobs', value: '8', delta: '+12%', direction: 'up', icon: BriefcaseBusiness, tone: 'jobs' },
  { label: 'Candidates', value: '128', delta: '+8%', direction: 'up', icon: Users, tone: 'candidates' },
  { label: 'In progress', value: '45', delta: '+15%', direction: 'up', icon: SlidersHorizontal, tone: 'interviews' },
  { label: 'Hired', value: '12', delta: '+20%', direction: 'up', icon: Check, tone: 'info' },
  { label: 'Rejected', value: '23', delta: '-5%', direction: 'down', icon: X, tone: 'error' },
] as const;

const statusStyles: Record<JobStatus, string> = {
  Active: 'bg-success-wash text-success-ink border-success-border',
  Paused: 'bg-warning-wash text-warning-ink border-warning-border',
  Expired: 'bg-surface-2 text-muted border-border',
};

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption font-medium', statusStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

function SummaryStrip() {
  return (
    <section aria-label="Jobs summary" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm sm:grid-cols-3 md:grid-cols-5 md:gap-0 md:p-0">
      {summaryItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cn('min-w-0 px-3 py-4 sm:px-4 md:px-5', index === 4 && 'col-span-2 sm:col-span-1', index > 0 && 'md:border-l md:border-border')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption text-muted">{item.label}</p>
                <p className="mt-1 text-h2 tabular text-heading">{item.value}</p>
              </div>
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', item.tone === 'jobs' && 'bg-jobs-wash-2 text-jobs-ink', item.tone === 'candidates' && 'bg-candidates-wash-2 text-candidates-ink', item.tone === 'interviews' && 'bg-interviews-wash-2 text-interviews-ink', item.tone === 'info' && 'bg-info-wash text-info-ink', item.tone === 'error' && 'bg-error-wash text-error-ink')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className={cn('mt-2 flex items-center gap-1 text-caption', item.direction === 'down' ? 'text-error-ink' : 'text-success-ink')}>
              {item.direction === 'down' ? <ArrowDown className="h-3 w-3" aria-hidden="true" /> : <ArrowUp className="h-3 w-3" aria-hidden="true" />}
              {item.delta} <span className="hidden text-muted sm:inline">vs last 30 days</span>
            </p>
          </div>
        );
      })}
    </section>
  );
}

function PipelineStages({ job, archived, onSelect }: { job: Job; archived: boolean; onSelect: (job: Job, stage: string) => void }) {
  return (
    <div className="flex min-w-max divide-x divide-border overflow-hidden rounded-md border border-border bg-surface-2">
      {job.stages.map((stage) => {
        const content = (
          <span className={cn('flex min-w-16 flex-col items-center gap-1 px-2 py-2 text-center transition-colors', !archived && 'hover:bg-surface-hover focus-visible:bg-surface-hover')}>
            <span className="text-body font-medium tabular text-heading">{stage.count}</span>
            <span className="max-w-16 truncate text-caption text-muted">{stage.label}</span>
            <span className={cn('h-1.5 w-1.5 rounded-full', stage.tone)} aria-hidden="true" />
          </span>
        );
        return archived ? (
          <div key={stage.label} aria-label={`${stage.count} candidates in ${stage.label}`} className="text-muted-foreground opacity-75">{content}</div>
        ) : (
          <button key={stage.label} type="button" onClick={() => onSelect(job, stage.label)} aria-label={`${stage.count} candidates in ${stage.label}`}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

function JobActions({ job, archived, onAction }: { job: Job; archived: boolean; onAction: (action: string, job: Job) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {archived ? (
        <Button variant="secondary" size="sm" onClick={() => onAction('restore', job)}><RotateCcw className="h-4 w-4" aria-hidden="true" />Restore</Button>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => onAction('invite', job)}><UserRoundPlus className="h-4 w-4" aria-hidden="true" />Invite candidate</Button>
      )}
      {!archived && <Button variant="ghost" size="icon-sm" aria-label={`Preview ${job.title}`} onClick={() => onAction('preview', job)}><Eye className="h-4 w-4" aria-hidden="true" /></Button>}
      {!archived && <Button variant="ghost" size="icon-sm" aria-label={`${job.status === 'Paused' ? 'Reactivate' : 'Pause'} ${job.title}`} onClick={() => onAction(job.status === 'Paused' ? 'reactivate' : 'pause', job)}>{job.status === 'Paused' ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}</Button>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`More actions for ${job.title}`}><MoreHorizontal className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!archived && <><DropdownMenuItem onSelect={() => onAction('edit', job)}>Edit job</DropdownMenuItem><DropdownMenuItem onSelect={() => onAction('clone', job)}><Copy className="mr-2 h-4 w-4" />Clone job</DropdownMenuItem><DropdownMenuSeparator /></>}
          <DropdownMenuItem onSelect={() => onAction(archived ? 'delete' : 'archive', job)} className={archived ? 'text-error-ink focus:text-error-ink' : ''}>{archived ? <><X className="mr-2 h-4 w-4" />Delete permanently</> : <><Archive className="mr-2 h-4 w-4" />Archive job</>}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function JobCard({ job, archived, view, onAction, onStageSelect }: { job: Job; archived: boolean; view: 'list' | 'grid'; onAction: (action: string, job: Job) => void; onStageSelect: (job: Job, stage: string) => void }) {
  return (
    <article className={cn('group rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-hover', view === 'grid' && 'flex h-full flex-col')}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jobs-wash-2 text-jobs-ink"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-h3 text-heading" title={job.title}>{job.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-muted">
              <span>{job.mode}</span><span aria-hidden="true">·</span><span>{job.location}</span><span aria-hidden="true">·</span><StatusBadge status={job.status} />
            </div>
          </div>
        </div>
        <JobActions job={job} archived={archived} onAction={onAction} />
      </div>
      <div className="mt-4 overflow-x-auto"><PipelineStages job={job} archived={archived} onSelect={onStageSelect} /></div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-caption text-muted">
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Created {job.created}</span>
        <span>{job.responded} responded</span><span className="text-success-ink">{job.responseRate} response rate</span>
        <span className="ml-auto">{job.candidates} candidates · {job.active} active in pipeline · Last activity {job.lastActivity}</span>
      </div>
    </article>
  );
}

function JobCardSkeleton() {
  return <div aria-hidden="true" className="rounded-lg border border-border bg-surface p-4 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-md bg-surface-2" /><div className="space-y-2"><div className="h-4 w-40 animate-pulse rounded-sm bg-surface-2" /><div className="h-3 w-56 animate-pulse rounded-sm bg-surface-2" /></div></div><div className="h-8 w-24 animate-pulse rounded-sm bg-surface-2" /></div><div className="mt-4 h-16 animate-pulse rounded-md bg-surface-2" /><div className="mt-3 h-4 w-2/3 animate-pulse rounded-sm bg-surface-2" /></div>;
}

function EmptyState({ archived, firstTime, onCreate }: { archived: boolean; firstTime?: boolean; onCreate: () => void }) {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-jobs-wash-2 text-jobs-ink"><BriefcaseBusiness className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-h2 text-heading">{firstTime ? 'Create your first job' : archived ? 'No archived jobs' : 'No active jobs'}</h2><p className="mt-2 max-w-md text-body text-muted">{firstTime ? 'Set up an opening and start bringing candidates into one clear interview pipeline.' : archived ? 'Jobs you archive will appear here when you are ready to keep them out of the active list.' : 'Create a new job to start collecting candidates and tracking progress.'}</p><Button className="mt-6" onClick={onCreate}><Plus className="h-4 w-4" aria-hidden="true" />{firstTime || !archived ? 'Create new job' : 'Back to active jobs'}</Button></div>;
}

export default function JobsPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<'active' | 'archived'>('active');
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [department, setDepartment] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('Last 30 days');
  const [sort, setSort] = React.useState('updated');
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(5);
  const [dialog, setDialog] = React.useState<{ action: string; job: Job } | null>(null);

  React.useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 700); return () => window.clearTimeout(timer); }, []);
  React.useEffect(() => { setVisibleCount(5); }, [tab, search, status, department, sort]);

  const jobs = tab === 'active' ? activeJobs : archivedJobs;
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.location} ${job.department}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || job.status === status) && (department === 'all' || job.department === department);
  });
  const sortedJobs = [...filteredJobs].sort((a, b) => sort === 'candidates' ? b.candidates - a.candidates : sort === 'oldest' ? a.created.localeCompare(b.created) : b.created.localeCompare(a.created));
  const shownJobs = sortedJobs.slice(0, visibleCount);

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

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="eyebrow text-jobs-ink">Hiring workspace</p><h1 className="mt-1 text-display text-heading">Jobs</h1><p className="mt-1 text-body-lg text-muted">Manage your job openings and track candidate progress.</p></div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button onClick={() => toast('Create new job opened')}><Plus className="h-4 w-4" aria-hidden="true" />Create new job</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary"><Filter className="h-4 w-4" aria-hidden="true" />Filters<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1 text-caption text-primary-ink">2</span><ChevronDown className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setStatus(status === 'Active' ? 'all' : 'Active')}><span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-xs border', status === 'Active' && 'border-primary bg-primary text-primary-foreground')}>{status === 'Active' && <Check className="h-3 w-3" aria-hidden="true" />}</span>Active jobs</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDepartment(department === 'Engineering' ? 'all' : 'Engineering')}><span className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-xs border', department === 'Engineering' && 'border-primary bg-primary text-primary-foreground')}>{department === 'Engineering' && <Check className="h-3 w-3" aria-hidden="true" />}</span>Engineering</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => { setStatus('all'); setDepartment('all'); }}>Clear filters</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary"><CalendarDays className="h-4 w-4" aria-hidden="true" />{dateRange}<ChevronDown className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time'].map((range) => <DropdownMenuItem key={range} onSelect={() => setDateRange(range)}>{range}{dateRange === range && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="mt-6"><SummaryStrip /></div>
        <div className="mt-6 flex flex-col gap-4 border-b border-border sm:flex-row sm:items-end sm:justify-between"><div className="flex gap-6" role="tablist" aria-label="Job views"><button type="button" role="tab" aria-selected={tab === 'active'} onClick={() => setTab('active')} className={cn('border-b-2 px-1 pb-3 text-button transition-colors', tab === 'active' ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading')}>Active jobs <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-caption">{activeJobs.length}</span></button><button type="button" role="tab" aria-selected={tab === 'archived'} onClick={() => setTab('archived')} className={cn('border-b-2 px-1 pb-3 text-button transition-colors', tab === 'archived' ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading')}>Archived jobs <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-caption">{archivedJobs.length}</span></button></div></div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full lg:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs by title, location or department..." aria-label="Search jobs" className="pl-9" /></div><div className="flex w-full flex-wrap items-center gap-2 lg:w-auto"><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Paused">Paused</SelectItem><SelectItem value="Expired">Expired</SelectItem></SelectContent></Select><Select value={sort} onValueChange={setSort}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Sort" /></SelectTrigger><SelectContent><SelectItem value="updated">Sort by: Recently updated</SelectItem><SelectItem value="oldest">Sort by: Oldest</SelectItem><SelectItem value="candidates">Sort by: Most candidates</SelectItem></SelectContent></Select><div className="ml-auto flex rounded-md border border-border-strong bg-surface p-0.5"><Button variant={view === 'list' ? 'default' : 'ghost'} size="icon-sm" aria-label="List view" onClick={() => setView('list')}><List className="h-4 w-4" aria-hidden="true" /></Button><Button variant={view === 'grid' ? 'default' : 'ghost'} size="icon-sm" aria-label="Grid view" onClick={() => setView('grid')}><Grid2X2 className="h-4 w-4" aria-hidden="true" /></Button></div></div></div>
        <div className="mt-4" aria-live="polite">{loading ? <div className="space-y-3"><JobCardSkeleton /><JobCardSkeleton /><JobCardSkeleton /></div> : sortedJobs.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center"><CircleAlert className="h-6 w-6 text-muted" aria-hidden="true" /><h2 className="mt-3 text-h2 text-heading">No jobs match your search</h2><p className="mt-2 text-body text-muted">Try a different search or clear the filters.</p><Button variant="secondary" className="mt-5" onClick={() => { setSearch(''); setStatus('all'); }}>Clear filters</Button></div> : <div className={cn(view === 'grid' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3')}>{shownJobs.map((job) => <JobCard key={job.id} job={job} archived={tab === 'archived'} view={view} onAction={handleAction} onStageSelect={handleStageSelect} />)}</div>}</div>
        {!loading && sortedJobs.length > 0 && visibleCount < sortedJobs.length && <div className="mt-5 flex justify-center"><Button variant="secondary" onClick={() => setVisibleCount((count) => count + 5)}>Load more jobs</Button></div>}
        {!loading && sortedJobs.length > 0 && <p className="mt-4 text-center text-caption text-muted">Showing {shownJobs.length} of {sortedJobs.length} jobs</p>}
      </div>
      <Button className="fixed bottom-6 right-6 z-sticky h-12 w-12 rounded-full p-0 shadow-lg sm:hidden" aria-label="Create new job" onClick={() => toast('Create new job opened')}><Plus className="h-5 w-5" aria-hidden="true" /></Button>
      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}><DialogContent><DialogHeader><DialogTitle>{copy?.title}</DialogTitle><DialogDescription>{copy?.description}</DialogDescription></DialogHeader><DialogFooter><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button variant={copy?.destructive ? 'destructive' : 'default'} onClick={confirmAction}>{copy?.confirm}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
