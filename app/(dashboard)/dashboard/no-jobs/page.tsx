'use client';

import * as React from 'react';
import { Activity, ArrowDown, ArrowUp, BriefcaseBusiness, Calendar, CircleCheckBig, CircleX, Layers, Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* Preview of the Overview page once a brand-new workspace has zero jobs —
   every count zeroed out and the first-time empty state in place of the job
   list. Lives at its own route so the empty state can be reviewed without
   waiting on real API integration to actually return zero jobs. */
const summaryItems = [
  { label: 'Jobs', icon: BriefcaseBusiness, tone: 'jobs' },
  { label: 'Candidates', icon: Users, tone: 'candidates' },
  { label: 'Review', icon: Activity, tone: 'ai' },
  { label: 'Extra stages', icon: Layers, tone: 'interviews' },
  { label: 'Hired', icon: CircleCheckBig, tone: 'info' },
  { label: 'Rejected', icon: CircleX, tone: 'error' },
] as const;

const toneTile: Record<string, string> = {
  jobs: 'bg-jobs-wash text-jobs-ink',
  candidates: 'bg-candidates-wash text-candidates-ink',
  ai: 'bg-ai-wash text-ai-ink',
  info: 'bg-info-wash text-info-ink',
  error: 'bg-error-wash text-error-ink',
  interviews: 'bg-interviews-wash text-interviews-ink',
};

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
              <p className="text-h2 tabular leading-none text-heading sm:text-h1">0</p>
              <p className="mt-1.5 truncate text-body-sm text-muted">{item.label}</p>
              <p className="mt-1.5 flex items-center gap-1 text-caption text-muted">
                <ArrowUp className="hidden h-3 w-3" aria-hidden="true" />
                <ArrowDown className="hidden h-3 w-3" aria-hidden="true" />
                No data yet <span className="hidden truncate font-normal 2xl:inline">vs last 30 days</span>
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function FirstJobEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-jobs-wash text-jobs-ink">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-h2 text-heading">Create your first job</h2>
      <p className="mt-2 max-w-md text-body text-muted">
        Set up an opening and start bringing candidates into one clear interview pipeline.
      </p>
      <Button className="mt-6" onClick={onCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create new job
      </Button>
    </div>
  );
}

export default function NoJobsPreviewPage() {
  const tabs = [
    { key: 'active' as const, label: 'Active jobs', count: 0 },
    { key: 'archived' as const, label: 'Archived jobs', count: 0 },
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
            <Button onClick={() => toast('Create new job opened')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create new job
            </Button>
            <Button variant="secondary">
              <Calendar className="h-4 w-4 text-muted" aria-hidden="true" />
              Last 30 days
            </Button>
          </div>
        </header>

        <div className="mt-6"><SummaryStrip /></div>

        <div className="mt-6 border-b border-border">
          <div className="flex gap-6" role="tablist" aria-label="Job views">
            {tabs.map((item, index) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={index === 0}
                className={cn(
                  '-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-button transition-colors',
                  index === 0 ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading'
                )}
              >
                {item.label}
                <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption', index === 0 ? 'bg-primary-soft text-primary-ink' : 'bg-surface-2 text-muted')}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input disabled placeholder="Search jobs by title, location or department..." aria-label="Search jobs" className="pl-9" />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <Select value="all" disabled>
              <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Status</SelectItem></SelectContent>
            </Select>
            <Select value="updated" disabled>
              <SelectTrigger className="w-full sm:w-56" aria-label="Sort jobs"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent><SelectItem value="updated">Sort by: Recently updated</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <FirstJobEmptyState onCreate={() => toast('Create new job opened')} />
        </div>
      </div>
    </div>
  );
}
