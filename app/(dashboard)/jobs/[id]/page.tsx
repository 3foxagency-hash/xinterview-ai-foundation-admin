'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, StickyNote, Copy, ExternalLink, Link as LinkIcon, Maximize2, Pause, Volume2, VolumeX, CircleCheck, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Download, FileText, Flag, FolderOpen, Headphones, KeyRound, List, Mail, MessageCircle, MoveHorizontal as MoreHorizontal, EllipsisVertical, MoveRight, Paperclip, Phone, Play, Search, Settings2, Share2, ShieldAlert, Sparkles, Star, Trash2, UserRound, UserRoundPlus, Users, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { activeJobs, archivedJobs, type Job } from '@/lib/jobs-mock';
import { aiOverview, candidateComments, candidateReviews, createJobLink, updateJobLink, getJobLinks, interviewQuestions, workflowCandidates, workflowStages, DEFAULT_SHARE_SETTINGS, MATCH_LABEL, MATCH_LEVELS, RESUME_META, RESUME_URL, SHARE_OPTIONS, type JobLink, type ShareOption, type ShareSettings, type Candidate, type FlagSeverity, type InterviewQuestion, type MatchLevel, type TeamNote, type WorkflowStage } from '@/lib/workflow-mock';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AnswerModal, FlagDot, QuestionNav, QuestionRail, Stars, VideoPlayer, formatTime } from '@/components/interview/interview-parts';

type CandidateView = 'Interview' | 'Resume' | 'Comments' | 'Reviews' | 'Activity';
type DialogState = 'comment' | 'note' | 'share' | 'share-bulk' | 'report' | 'delete' | 'compare' | 'create-link' | 'edit-link' | 'manage-link' | null;

function scoreTone(score: number) {
  return score >= 75 ? 'bg-success-wash text-success-ink' : score >= 50 ? 'bg-warning-wash text-warning-ink' : 'bg-surface-2 text-muted';
}

function ScoreBadge({ score }: { score?: number }) {
  return score ? <span className={cn('inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-body font-semibold tabular', scoreTone(score))}>{score}</span> : <span className="text-caption font-normal text-muted">Not scored</span>;
}

/* Renders nothing when unrated rather than a placeholder row: the fixed-width
   rail already holds the column, and a "Not rated" line of a different height
   was what knocked the scores out of alignment. */
function Rating({ rating, reviews }: { rating?: number; reviews?: number }) {
  if (!rating) return null;
  return <span className="flex items-center gap-1 text-caption font-medium text-heading"><Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />{rating.toFixed(1)}{reviews ? <span className="font-normal text-muted">({reviews})</span> : null}</span>;
}

/* The stage rail spans the full width and divides it evenly, so five stages
   and nine stages both fill the bar with equal gaps instead of bunching to
   the left. `min-w-max` was what previously stopped it from stretching.

   Each stage is a flex-1 cell with its own chevron, so the separators stay
   evenly spaced as the count changes. Below `lg` the rail falls back to
   horizontal scrolling — nine stages cannot be legible in 390px. */
function StageTabs({ selected, onChange, stages = workflowStages, label = 'Candidate stages' }: { selected: string; onChange: (stage: WorkflowStage) => void; stages?: WorkflowStage[]; label?: string }) {
  /* The rail always spreads to fill its width. Type and padding step down as
     the stage count grows so nine labels still fit the same space five would
     — a fixed breakpoint could not do this, because whether the labels fit
     depends on the count, not only on the viewport. Below `lg` there is no
     width to divide, so it falls back to scrolling at natural size. */
  const dense = stages.length >= 8;
  const medium = stages.length === 7;

  return <div className="flex min-w-max items-stretch border-b border-border bg-surface px-4 lg:min-w-0 lg:px-6" role="tablist" aria-label={label}>
    {stages.map((stage, index) => (
      <React.Fragment key={stage.id}>
        <button
          type="button"
          role="tab"
          aria-selected={selected === stage.id}
          onClick={() => onChange(stage)}
          title={stage.label}
          className={cn(
            'relative flex min-h-14 shrink-0 items-center justify-center gap-1.5 px-3 transition-colors sm:px-5 lg:shrink lg:grow lg:basis-0',
            /* Readable floor per cell. While the rail is wider than
               count × floor it spreads to fill; under that it stops
               shrinking and the container scrolls. */
            dense
              ? 'text-caption lg:min-w-[116px] lg:gap-1 lg:px-0.5 xl:text-body-sm xl:gap-1.5 xl:px-1'
              : medium
                ? 'text-body-sm lg:min-w-[130px] lg:px-1 xl:px-2'
                : 'text-body-sm lg:min-w-[132px] lg:px-2 xl:text-button xl:px-3',
            selected === stage.id ? 'font-medium text-primary-ink' : stage.terminal ? 'text-error-ink hover:text-error' : 'text-muted hover:text-heading'
          )}
        >
          <span className="truncate">{stage.label}</span>
          <span className={cn(
            'shrink-0 rounded-full text-caption tabular',
            dense ? 'px-1.5 py-0.5' : 'px-2 py-0.5',
            selected === stage.id ? 'bg-primary-soft text-primary-ink' : stage.terminal ? 'bg-error-wash text-error-ink' : 'bg-surface-2 text-muted'
          )}>{stage.count}</span>
          {selected === stage.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
        </button>
        {index < stages.length - 1 && (
          <span className="flex shrink-0 items-center" aria-hidden="true"><ChevronRight className={cn('text-border-strong', dense ? 'h-3 w-3 lg:mx-0' : 'h-4 w-4')} /></span>
        )}
      </React.Fragment>
    ))}
  </div>;
}


/* Match bands, not a numeric score. Ranking people 0–100 invites false
   precision and unfair comparison, so the AI reports a band and nothing
   finer; each band gets its own wash so the list stays scannable. */
const matchTone: Record<MatchLevel, string> = {
  perfect: 'border-success-border bg-success-wash text-success-ink',
  good: 'border-info-border bg-info-wash text-info-ink',
  average: 'border-warning-border bg-warning-wash text-warning-ink',
  poor: 'border-border bg-surface-2 text-muted',
};

function MatchBadge({ match, className }: { match?: MatchLevel; className?: string }) {
  if (!match) return <span className={cn('text-caption font-normal text-muted', className)}>Not assessed</span>;
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-caption font-medium', matchTone[match], className)}>{MATCH_LABEL[match]}</span>;
}

function CandidateRow({ candidate, selected, checked, onCheck, onSelect }: { candidate: Candidate; selected: boolean; checked: boolean; onCheck: (checked: boolean) => void; onSelect: () => void }) {
  return <div role="button" tabIndex={0} aria-pressed={selected} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(); } }} className={cn('flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-3 transition-colors', selected ? 'bg-primary-soft' : 'hover:bg-surface-hover')} onClick={onSelect}>
    <Checkbox className="mt-0.5" checked={checked} onCheckedChange={(value) => onCheck(value === true)} aria-label={`Select ${candidate.name}`} onClick={(event) => event.stopPropagation()} />
    {/* Long names wrap rather than truncate — the row grows so a full name
        stays readable, as in the reference. */}
    <div className="min-w-0 flex-1"><div className="flex items-start gap-1.5"><p className="min-w-0 text-body-sm font-medium text-heading">{candidate.name}</p>{candidate.live && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-label="Live activity" />}</div><p className="mt-0.5 truncate text-caption font-normal text-muted">{candidate.applied} · {candidate.source}</p></div>
    <div className="flex shrink-0 flex-col items-end gap-1.5"><MatchBadge match={candidate.match} /><Rating rating={candidate.rating} /></div>
  </div>;
}

function CandidateList({ candidates, selectedCandidate, checkedIds, query, sort, matchFilter, onQueryChange, onSortChange, onMatchFilterChange, onSelect, onCheck, onSelectAll, onClear }: { candidates: Candidate[]; selectedCandidate: Candidate; checkedIds: Set<string>; query: string; sort: string; matchFilter: MatchLevel | 'all'; onQueryChange: (value: string) => void; onSortChange: (value: string) => void; onMatchFilterChange: (value: MatchLevel | 'all') => void; onSelect: (candidate: Candidate) => void; onCheck: (id: string, checked: boolean) => void; onSelectAll: () => void; onClear: () => void }) {
  const filtered = candidates.filter((candidate) => `${candidate.name} ${candidate.email}`.toLowerCase().includes(query.toLowerCase())).filter((candidate) => matchFilter === 'all' || candidate.match === matchFilter).sort((a, b) => sort === 'match' ? MATCH_LEVELS.indexOf(a.match ?? 'poor') - MATCH_LEVELS.indexOf(b.match ?? 'poor') : sort === 'name' ? a.name.localeCompare(b.name) : 0);
  const allChecked = filtered.length > 0 && filtered.every((candidate) => checkedIds.has(candidate.id));
  const toggleAll = () => allChecked ? onClear() : onSelectAll();
  return <aside className="flex h-[48vh] min-h-0 flex-col overflow-hidden border-b border-border bg-surface p-3 lg:h-auto lg:max-h-none lg:border-b-0 lg:border-r"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" /><Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search candidates..." aria-label="Search candidates" className="pl-9" /></div><div className="mt-3 grid grid-cols-2 gap-2"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" className="w-full justify-between px-3"><span className="flex min-w-0 items-center gap-1.5"><Sparkles className="h-4 w-4 shrink-0 text-ai-ink" aria-hidden="true" /><span className="truncate">{matchFilter === 'all' ? 'AI Match' : MATCH_LABEL[matchFilter]}</span></span><ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-48"><DropdownMenuItem onSelect={() => onMatchFilterChange('all')}>All candidates{matchFilter === 'all' && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem><DropdownMenuSeparator />{MATCH_LEVELS.map((level) => <DropdownMenuItem key={level} onSelect={() => onMatchFilterChange(level)}>{MATCH_LABEL[level]}{matchFilter === level && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu><Select value={sort} onValueChange={onSortChange}><SelectTrigger><List className="h-4 w-4 text-muted" aria-hidden="true" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="match">AI match</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent></Select></div><div className="mt-4 flex items-center justify-between px-1 text-caption"><label className="flex items-center gap-2 text-muted"><Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all candidates" />Select all</label>{checkedIds.size > 0 ? <button type="button" className="text-primary-ink hover:underline" onClick={onClear}>Clear</button> : <span className="text-muted">{filtered.length} candidates</span>}</div><div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">{filtered.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center text-center"><UserRound className="h-6 w-6 text-muted" aria-hidden="true" /><p className="mt-2 text-body font-medium text-heading">No candidates found</p><p className="mt-1 text-caption text-muted">Try a different name or email.</p></div> : filtered.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} selected={selectedCandidate.id === candidate.id} checked={checkedIds.has(candidate.id)} onCheck={(checked) => onCheck(candidate.id, checked)} onSelect={() => onSelect(candidate)} />)}</div></aside>;
}

/* One labelled action tile — the reference names every header action instead
   of leaving a bare glyph to decode. */
function HeaderAction({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-w-0 flex-col items-center gap-1.5 rounded-md px-2 py-2 text-caption font-normal text-muted transition-colors hover:bg-surface-hover hover:text-heading sm:min-w-[68px]"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface"><Icon className="h-4 w-4" /></span>{label}</button>;
}

function CandidateHeader({ candidate, onDialog, hasLinks }: { candidate: Candidate; onDialog: (dialog: DialogState) => void; hasLinks: boolean }) {
  return <div className="flex flex-col items-start gap-4 border-b border-border bg-surface px-4 py-4 sm:px-6 xl:flex-row xl:flex-wrap xl:items-start xl:justify-between xl:gap-x-6">
    <div className="flex w-full min-w-0 items-start gap-4 xl:flex-1 xl:min-w-[280px]">
      <div className="min-w-0">
        <h1 className="truncate text-h1 text-heading">{candidate.name}</h1>
        <p className="mt-0.5 text-body text-muted">{candidate.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-muted">
          <span className="flex min-w-0 items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{candidate.email}</span></span>
          <span className="flex shrink-0 items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{candidate.phone}</span>
        </div>
        <p className="mt-1.5 whitespace-nowrap text-body-sm text-muted">Applied on {candidate.applied} · <span className="font-medium text-primary-ink">In Progress</span></p>
      </div>
    </div>
    {/* Both cards sit on the right of the identity block and are matched in
        height by `items-stretch` — they previously wrapped underneath and
        rendered at two different sizes, leaving the right half empty. */}
    <div className="flex w-full flex-col items-stretch gap-3 max-lg:sm:flex-row xl:w-auto xl:shrink-0 xl:flex-row">
      <div className="flex items-center justify-center gap-5 rounded-lg border border-border bg-surface px-5 py-3 max-sm:justify-around">
        <div className="flex flex-col items-center justify-center text-center">
          <MatchBadge match={candidate.match} className="px-3 py-1 text-body-sm" />
          <p className="mt-1.5 text-caption font-normal text-muted">AI assessment</p>
        </div>
        <div className="flex flex-col items-center justify-center text-center">
          <p className="flex items-center justify-center gap-1.5 text-h1 text-heading"><Star className="h-5 w-5 fill-warning text-warning" aria-hidden="true" />{candidate.rating ? candidate.rating.toFixed(1) : '—'}</p>
          <p className="mt-1 max-w-[112px] text-caption font-normal leading-4 text-muted">Average rating{candidate.reviews > 0 && ` from ${candidate.reviews} reviews`}</p>
        </div>
      </div>
      <div className="flex items-center rounded-lg border border-border bg-surface p-1 max-sm:justify-around">
        <HeaderAction icon={Share2} label="Share" onClick={() => onDialog('share')} />
        <HeaderAction icon={MessageCircle} label="Comment" onClick={() => onDialog('comment')} />
        <HeaderAction icon={Star} label="Add Review" onClick={() => onDialog('note')} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" className="flex min-w-0 flex-col items-center gap-1.5 rounded-md px-2 py-2 text-caption font-normal text-muted transition-colors hover:bg-surface-hover hover:text-heading sm:min-w-[68px]"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface"><EllipsisVertical className="h-4 w-4" /></span>More</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => toast('Invite resent')}>Resend invite</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Deadline extension opened')}>Extend deadline</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast('Export options opened')}><Download className="mr-2 h-4 w-4" />Export candidate</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDialog(hasLinks ? 'manage-link' : 'create-link')}><LinkIcon className="mr-2 h-4 w-4" />{hasLinks ? 'Manage Link' : 'Create Link'}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error-ink focus:text-error-ink" onSelect={() => onDialog('delete')}><Trash2 className="mr-2 h-4 w-4" />Delete candidate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
      <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className={score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-error'} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
    </svg>
    <span className="absolute flex flex-col items-center"><span className="text-h2 tabular text-heading">{score}</span><span className="text-caption font-normal text-muted">/100</span></span>
  </div>;
}

/* Prev/next/grid/pips for the question section. Sits on the section's own
   heading row, below the detail tabs — the tabs row carries only the view
   tabs. */
/* A fixed-size window of pips centred on the current question, rather than
   one pip per question — with a hundred questions that would run the strip
   off the page. Always at most PIP_WINDOW pips; a small leading/trailing dot
   stands in for "more before/after" when the total exceeds the window, so
   the shape stays legible at 5 questions or 500. */
function InterviewView({ questionIndex, onQuestionChange, onDialog, onMove }: { questionIndex: number; onQuestionChange: (index: number) => void; onDialog: (dialog: DialogState) => void; onMove: (stage: string) => void }) {
  const question = interviewQuestions[questionIndex];
  const [nextStage, setNextStage] = React.useState('Review');
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const moveTargets = workflowStages.filter((stage) => !['invited', 'in-progress', 'rejected'].includes(stage.id));

  return <section className="min-w-0">
    <div className="flex items-center justify-between gap-3 pb-3">
      <span className="text-body font-medium text-heading">Question {question.number} of {interviewQuestions.length}</span>
      <QuestionNav questionIndex={questionIndex} onQuestionChange={onQuestionChange} />
    </div>
    <VideoPlayer duration={question.duration} seconds={question.seconds} />

    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="shrink-0 rounded-md bg-primary-soft px-2 py-1 text-caption font-semibold text-primary-ink">Q{question.number}</span><h2 className="text-h3 text-heading">{question.text}</h2></div>
          <div className="mt-3 flex flex-wrap gap-2 text-caption font-normal text-muted">
            <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Allowed time: {question.allowed}</span>
            <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Your answer: {question.duration}</span>
            {question.flagged && <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 font-medium', question.flagged === 'high' ? 'bg-error-wash text-error-ink' : 'bg-warning-wash text-warning-ink')}><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />AI Flagged</span>}
          </div>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setDetailsOpen(true)}>View question details</Button>
      </div>
    </div>

    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai-ink" aria-hidden="true" /><h2 className="text-h3 text-heading">AI Overview</h2></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div><p className="text-caption font-normal text-muted">Overall Verdict</p><p className="mt-1 text-h2 text-success-ink">{aiOverview.verdict}</p><p className="mt-1 text-body-sm text-muted">{aiOverview.summary}</p></div>
        <div className="lg:border-l lg:border-border lg:pl-5"><p className="text-caption font-normal text-muted">Strengths</p><ul className="mt-2 space-y-1.5 text-body-sm text-heading">{aiOverview.strengths.map((item) => <li key={item} className="flex gap-2"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 fill-success text-surface" aria-hidden="true" />{item}</li>)}</ul></div>
        <div className="lg:border-l lg:border-border lg:pl-5"><p className="text-caption font-normal text-muted">Areas to Improve</p><ul className="mt-2 space-y-1.5 text-body-sm text-heading">{aiOverview.improvements.map((item) => <li key={item} className="flex gap-2"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 fill-warning text-surface" aria-hidden="true" />{item}</li>)}</ul></div>
      </div>
    </div>

    {/* Two labelled decisions: advancing carries a split button (act, or pick
        another stage), rejecting is separated so it is not hit by accident. */}
    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0"><p className="truncate text-body font-medium text-heading">Move to next stage</p><p className="mt-0.5 text-caption font-normal text-muted">{nextStage}</p></div>
        <div className="flex">
          <Button className="min-w-0 rounded-r-none max-sm:px-2" onClick={() => onMove(nextStage)}><span className="truncate max-sm:hidden">Move to {nextStage}</span><span className="truncate sm:hidden">Move</span></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button className="rounded-l-none border-l border-primary-active px-2" aria-label="Choose a different stage"><ChevronDown className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">{moveTargets.map((stage) => <DropdownMenuItem key={stage.id} onSelect={() => setNextStage(stage.label)}>{stage.label}{stage.label === nextStage && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem>)}</DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-col justify-between gap-3 border-l border-border pl-3 sm:flex-row sm:items-center sm:pl-4">
        <div className="min-w-0"><p className="truncate text-body font-medium text-heading">Reject candidate</p><p className="mt-0.5 text-caption font-normal text-muted">This is a hiring decision</p></div>
        <Button variant="destructive" className="shrink-0" onClick={() => onDialog('delete')}>Reject</Button>
      </div>
    </div>
    <AnswerModal question={detailsOpen ? question : null} onClose={() => setDetailsOpen(false)} />
  </section>;
}

/* Severity dot: red for a hard flag, amber for a soft one. */
function NoteList({ notes, empty, variant }: { notes: TeamNote[]; empty: string; variant: 'comment' | 'review' }) {
  if (notes.length === 0) {
    return <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
      <p className="text-body font-medium text-heading">{empty}</p>
      <p className="mt-1 text-body-sm text-muted">Anything you add here is visible to the hiring team.</p>
    </div>;
  }
  /* Each note is its own card. The flat divided list gave comments no weight
     of their own, so they read as filler next to the star-carrying reviews. */
  return <ul className="space-y-3">
    {notes.map((note) => (
      <li key={note.id} className="rounded-lg border border-border bg-surface-2/60 p-4 transition-colors hover:border-border-hover">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-body-sm font-semibold text-heading">{note.author}</span>
          <span className="truncate text-caption font-normal text-muted">{note.email}</span>
          <span className="ml-auto shrink-0 text-caption font-normal text-muted">{note.at}</span>
        </div>
        {variant === 'review' && note.stars !== undefined && <Stars value={note.stars} className="mt-2" />}
        <p className={cn('text-body-sm leading-relaxed text-bodyText', variant === 'review' ? 'mt-2' : 'mt-2')}>{note.body}</p>
      </li>
    ))}
  </ul>;
}

/* ── Share link ──
   Mirrors the flow on the live product: pick what the recipient may see,
   generate a link, then copy it. The modal has two states — before the link
   exists the primary action generates it; afterwards a read-only field with a
   copy button takes its place, and the toggles stay editable so the settings
   can still be adjusted (which regenerates the link). */
function ShareDialog({ candidates, open, onOpenChange }: { candidates: Candidate[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const bulk = candidates.length > 1;
  const [settings, setSettings] = React.useState<ShareSettings>(DEFAULT_SHARE_SETTINGS);
  const [link, setLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // A fresh dialog always starts from the default options and no link.
  React.useEffect(() => {
    if (!open) return;
    setSettings(DEFAULT_SHARE_SETTINGS);
    setLink(null);
    setCopied(false);
  }, [open]);

  /* Changing an option invalidates the link it produced, so the recipient can
     never end up with a URL that grants more than the current settings. */
  const toggle = (id: ShareOption['id']) => {
    setSettings((current) => ({ ...current, [id]: !current[id] }));
    setLink(null);
    setCopied(false);
  };

  const generate = () => {
    const enabled = (Object.keys(settings) as ShareOption['id'][]).filter((key) => settings[key]);
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    /* One link for the whole selection: the recipient sees a shared view whose
       sidebar is limited to exactly these candidates. The URL carries each
       candidate's opaque shareToken, never their id (which is name-derived
       in this mock data) — otherwise a name-off link would still leak the
       name through the link itself. */
    const ids = candidates.map((item) => item.shareToken).join(',');
    const query = [ids ? `c=${ids}` : '', enabled.length ? `opts=${enabled.join(',')}` : ''].filter(Boolean).join('&');
    setLink(`${origin}/share${query ? `?${query}` : ''}`);
    setCopied(false);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast('Share link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bulk ? `Share ${candidates.length} candidates` : 'Copy share link'}</DialogTitle>
          <DialogDescription>Anyone with this link can view {bulk ? 'these interviews' : 'the interview'}. Choose what they can see.</DialogDescription>
        </DialogHeader>

        {link && (
          <div className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-md border border-border bg-surface-2 p-1.5 pl-3">
            <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-body-sm text-heading" title={link}>{link}</span>
            <Button size="sm" variant={copied ? 'secondary' : 'default'} className="shrink-0" onClick={copy}>
              {copied ? <><Check className="h-4 w-4" aria-hidden="true" />Copied</> : <><Copy className="h-4 w-4" aria-hidden="true" />Copy</>}
            </Button>
          </div>
        )}

        {bulk && (
          <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-surface-2 p-2.5">
            {candidates.map((item) => (
              <span key={item.id} className="rounded-full border border-border bg-surface px-2 py-0.5 text-caption text-heading">{item.name}</span>
            ))}
          </div>
        )}

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {SHARE_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-start gap-2.5">
              <Switch id={`share-${option.id}`} checked={settings[option.id]} onCheckedChange={() => toggle(option.id)} className="mt-0.5 shrink-0" />
              <label htmlFor={`share-${option.id}`} className="min-w-0 cursor-pointer">
                <span className="block text-body-sm font-medium text-heading">{option.label}</span>
                <span className="mt-0.5 block text-caption font-normal leading-4 text-muted">{option.hint}</span>
              </label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          {!link && <Button onClick={generate}><LinkIcon className="h-4 w-4" aria-hidden="true" />Generate link</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Link (job-level) ──
   A four-step wizard, distinct from ShareDialog above: this bundles a chosen
   set of candidates, questions and internal users behind one persisted link,
   optionally PIN-protected. Reuses SHARE_OPTIONS/ShareSettings for the
   options step so a link's visibility toggles stay identical to the
   candidate share flow. */
type LinkStep = 1 | 2 | 3 | 4;

function StepDots({ step }: { step: LinkStep }) {
  const labels = ['Link', 'Questions', 'Candidates', 'Summary'];
  return <div className="flex items-center gap-2">
    {labels.map((label, index) => {
      const value = (index + 1) as LinkStep;
      return <React.Fragment key={label}>
        <span className={cn('flex items-center gap-1.5 text-caption font-medium', value === step ? 'text-primary-ink' : value < step ? 'text-muted' : 'text-muted/60')}>
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[10px]', value === step ? 'bg-primary text-primary-foreground' : value < step ? 'bg-surface-2 text-heading' : 'bg-surface-2 text-muted')}>{value < step ? <Check className="h-3 w-3" aria-hidden="true" /> : value}</span>
          <span className="hidden sm:inline">{label}</span>
        </span>
        {index < labels.length - 1 && <span className="h-px w-4 shrink-0 bg-border" aria-hidden="true" />}
      </React.Fragment>;
    })}
  </div>;
}

/* A 4-box OTP-style PIN entry: each box holds one digit, typing advances
   focus automatically, and Backspace on an empty box steps back — the usual
   OTP feel rather than one free-text field. */
function PinInput({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: boolean }) {
  const digits = Array.from({ length: 4 }, (_, index) => value[index] ?? '');
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(''));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < 3) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      setDigit(index - 1, '');
    } else if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted.padEnd(4, '').slice(0, 4).replace(/ /g, ''));
    refs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="4-digit PIN">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { refs.current[index] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          aria-label={`PIN digit ${index + 1}`}
          className={cn('h-11 w-11 rounded-md border bg-surface text-center text-h3 tabular text-heading focus:outline-none focus:ring-2 focus:ring-primary/40', error ? 'border-error' : 'border-border-strong')}
        />
      ))}
    </div>
  );
}

function CreateLinkDialog({ jobId, open, onOpenChange, mode, link, onCreated, onUpdated }: { jobId: string; open: boolean; onOpenChange: (open: boolean) => void; mode: 'create' | 'edit'; link?: JobLink | null; onCreated: (link: JobLink) => void; onUpdated: (link: JobLink) => void }) {
  const [step, setStep] = React.useState<LinkStep>(1);
  const [name, setName] = React.useState('');
  const [candidateIds, setCandidateIds] = React.useState<Set<string>>(new Set());
  const [settings, setSettings] = React.useState<ShareSettings>(DEFAULT_SHARE_SETTINGS);
  const [passwordProtected, setPasswordProtected] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [questionIds, setQuestionIds] = React.useState<Set<string>>(new Set());
  const [creating, setCreating] = React.useState(false);
  const [created, setCreated] = React.useState<JobLink | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStep(1);
    setCreated(null);
    setCopied(false);
    if (mode === 'edit' && link) {
      setName(link.name);
      setCandidateIds(new Set(link.candidateIds));
      setSettings(link.settings);
      setPasswordProtected(Boolean(link.pin));
      setPin(link.pin ?? '');
      setQuestionIds(new Set(link.questionIds));
    } else {
      setName('');
      setCandidateIds(new Set());
      setSettings(DEFAULT_SHARE_SETTINGS);
      setPasswordProtected(false);
      setPin('');
      setQuestionIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, link?.id]);

  const pinValid = !passwordProtected || /^\d{4}$/.test(pin);
  const nameValid = name.trim().length > 0;
  const step1Valid = nameValid && pinValid;
  const isEdit = mode === 'edit';

  const toggleSet = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) => setFn((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleCandidate = toggleSet(setCandidateIds);
  const toggleQuestion = toggleSet(setQuestionIds);
  const toggleOption = (id: ShareOption['id']) => setSettings((current) => ({ ...current, [id]: !current[id] }));

  const selectedCandidates = workflowCandidates.filter((item) => candidateIds.has(item.id));
  const selectedQuestions = interviewQuestions.filter((item) => questionIds.has(item.id));
  const enabledOptions = SHARE_OPTIONS.filter((option) => settings[option.id]);

  const handleSave = async () => {
    setCreating(true);
    try {
      const input = {
        name: name.trim(),
        candidateIds: Array.from(candidateIds),
        questionIds: Array.from(questionIds),
        settings,
        pin: passwordProtected ? pin : null,
      };
      if (isEdit && link) {
        const updated = updateJobLink(jobId, link.id, input);
        if (!updated) throw new Error('not found');
        onUpdated(updated);
        toast('Link updated');
        onOpenChange(false);
      } else {
        const created = createJobLink(jobId, input);
        setCreated(created);
        onCreated(created);
        toast('Link created');
      }
    } catch {
      toast.error(isEdit ? 'Could not update the link' : 'Could not create the link');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      toast('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && created) { onOpenChange(false); return; } onOpenChange(next); }}>
      <DialogContent className="flex h-[90vh] max-h-[860px] w-[95vw] max-w-3xl flex-col overflow-hidden sm:h-[85vh]">
        <DialogHeader>
          <DialogTitle>{created ? 'Link created' : isEdit ? 'Edit link' : 'Create link'}</DialogTitle>
          <DialogDescription>{created ? 'Share this link with anyone who needs access.' : 'Bundle candidates and questions behind one shareable link.'}</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-wash"><Check className="h-7 w-7 text-success-ink" aria-hidden="true" /></span>
            <div>
              <p className="text-h3 text-heading">{created.name}</p>
              <p className="mt-1 text-body-sm text-muted">Anyone with this link can open it{created.pin ? ' after entering the PIN' : ''}.</p>
            </div>
            <div className="flex w-full max-w-lg min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3 sm:flex-row sm:items-center">
              <span className="block min-w-0 flex-1 break-all text-left font-mono text-body-sm text-heading" title={created.url}>{created.url}</span>
              <Button size="sm" variant={copied ? 'secondary' : 'default'} className="w-full shrink-0 sm:w-auto" onClick={copyLink}>
                {copied ? <><Check className="h-4 w-4" aria-hidden="true" />Copied</> : <><Copy className="h-4 w-4" aria-hidden="true" />Copy link</>}
              </Button>
            </div>
            {created.pin && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                <span className="text-caption text-muted">PIN</span>
                <span className="font-mono text-body-sm font-semibold tracking-[0.2em] text-heading">{created.pin}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border pb-4"><StepDots step={step} /></div>

            <div className="min-h-0 flex-1 overflow-y-auto py-1 pr-1">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-body-sm font-medium text-heading" htmlFor="link-name">Link name</label>
                    <Input id="link-name" className="mt-1.5 h-11 text-body" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Shortlist for hiring panel" />
                  </div>

                  <div>
                    <p className="text-body-sm font-medium text-heading">Link permissions</p>
                    <p className="mt-0.5 text-caption text-muted">Choose what anyone opening this link can see or do.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {SHARE_OPTIONS.map((option) => (
                        <label key={option.id} htmlFor={`link-${option.id}`} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors', settings[option.id] ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface hover:bg-surface-hover')}>
                          <Switch id={`link-${option.id}`} checked={settings[option.id]} onCheckedChange={() => toggleOption(option.id)} className="mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="block text-body-sm font-medium text-heading">{option.label}</span>
                            <span className="mt-0.5 block text-caption font-normal leading-4 text-muted">{option.hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={cn('rounded-lg border p-4 transition-colors', passwordProtected ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface')}>
                    <div className="flex items-start gap-3">
                      <Switch id="link-pw" checked={passwordProtected} onCheckedChange={setPasswordProtected} className="mt-0.5 shrink-0" />
                      <label htmlFor="link-pw" className="min-w-0 flex-1 cursor-pointer">
                        <span className="flex items-center gap-1.5 text-body-sm font-medium text-heading"><KeyRound className="h-3.5 w-3.5" aria-hidden="true" />Password protect this link</span>
                        <span className="mt-0.5 block text-caption font-normal leading-4 text-muted">Require a 4-digit PIN before the link can be opened.</span>
                      </label>
                    </div>
                    {passwordProtected && (
                      <div className="mt-4 border-t border-border/70 pt-4 pl-8">
                        <p className="mb-2 text-caption font-medium text-muted">Enter a 4-digit PIN</p>
                        <PinInput value={pin} onChange={setPin} error={pin.length > 0 && !pinValid} />
                        {pin.length > 0 && !pinValid && <p className="mt-2 text-caption text-error-ink">Enter exactly 4 digits.</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-body-sm font-medium text-heading">Questions</p>
                      <p className="text-caption text-muted">Choose which questions are visible through this link.</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption" onClick={() => setQuestionIds(new Set(interviewQuestions.map((item) => item.id)))}>Select all</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption" onClick={() => setQuestionIds(new Set())}>Select none</Button>
                    </div>
                  </div>
                  <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {interviewQuestions.map((item) => {
                      const checked = questionIds.has(item.id);
                      return (
                        <label key={item.id} htmlFor={`q-${item.id}`} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors', checked ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface hover:bg-surface-hover')}>
                          <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold', checked ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted')}>{item.number}</span>
                          <span className="min-w-0 flex-1 pt-0.5 text-body-sm font-medium leading-5 text-heading">{item.text}</span>
                          <Checkbox id={`q-${item.id}`} className="mt-1 shrink-0" checked={checked} onCheckedChange={() => toggleQuestion(item.id)} />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 shrink-0 text-caption text-muted">{questionIds.size} of {interviewQuestions.length} selected</p>
                </div>
              )}

              {step === 3 && (
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-body-sm font-medium text-heading">Candidates</p>
                      <p className="text-caption text-muted">Choose which candidates this link gives access to.</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption" onClick={() => setCandidateIds(new Set(workflowCandidates.map((item) => item.id)))}>Select all</Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-caption" onClick={() => setCandidateIds(new Set())}>Select none</Button>
                    </div>
                  </div>
                  <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {workflowCandidates.map((item) => {
                      const checked = candidateIds.has(item.id);
                      return (
                        <label key={item.id} htmlFor={`c-${item.id}`} className={cn('flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors', checked ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface hover:bg-surface-hover')}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-caption font-semibold text-primary-ink">{item.initials}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-sm font-medium text-heading">{item.name}</span>
                            <span className="block truncate text-caption text-muted">{item.title}</span>
                          </span>
                          <MatchBadge match={item.match} className="hidden shrink-0 sm:inline-flex" />
                          <Checkbox id={`c-${item.id}`} className="shrink-0" checked={checked} onCheckedChange={() => toggleCandidate(item.id)} />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 shrink-0 text-caption text-muted">{candidateIds.size} of {workflowCandidates.length} selected</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-caption font-medium uppercase tracking-wide text-muted">Link name</p>
                    <p className="mt-1 text-h3 text-heading">{name || '—'}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <p className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-muted"><FileText className="h-3.5 w-3.5" aria-hidden="true" />Questions</p>
                      <p className="mt-1 text-h3 text-heading">{selectedQuestions.length} <span className="text-body-sm font-normal text-muted">of {interviewQuestions.length}</span></p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {selectedQuestions.length ? selectedQuestions.map((q) => <span key={q.id} className="rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium text-heading">Q{q.number}</span>) : <span className="text-caption text-muted">None selected</span>}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-surface p-4">
                      <p className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-muted"><UserRound className="h-3.5 w-3.5" aria-hidden="true" />Candidates</p>
                      <p className="mt-1 text-h3 text-heading">{selectedCandidates.length} <span className="text-body-sm font-normal text-muted">of {workflowCandidates.length}</span></p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {selectedCandidates.length ? selectedCandidates.map((item) => <span key={item.id} className="rounded-full bg-surface-2 px-2 py-0.5 text-caption font-medium text-heading">{item.name}</span>) : <span className="text-caption text-muted">None selected</span>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-caption font-medium uppercase tracking-wide text-muted">Link permissions</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {enabledOptions.length ? enabledOptions.map((option) => <span key={option.id} className="inline-flex items-center gap-1 rounded-full bg-success-wash px-2.5 py-1 text-caption font-medium text-success-ink"><Check className="h-3 w-3" aria-hidden="true" />{option.label}</span>) : <span className="text-caption text-muted">None enabled</span>}
                    </div>
                  </div>

                  <div className={cn('flex items-center justify-between rounded-lg border p-4', passwordProtected ? 'border-primary/30 bg-primary-soft' : 'border-border bg-surface')}>
                    <span className="flex items-center gap-2 text-body-sm font-medium text-heading"><KeyRound className="h-4 w-4" aria-hidden="true" />Password protection</span>
                    {passwordProtected ? <span className="font-mono text-body-sm font-semibold tracking-[0.2em] text-heading">{pin}</span> : <span className="text-caption text-muted">Disabled</span>}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="shrink-0">
          {created ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => step === 1 ? onOpenChange(false) : setStep((current) => (current - 1) as LinkStep)}>{step === 1 ? 'Cancel' : 'Back'}</Button>
              {step < 4 ? (
                <Button disabled={step === 1 && !step1Valid} onClick={() => setStep((current) => (current + 1) as LinkStep)}>Next</Button>
              ) : (
                <Button onClick={handleSave} disabled={creating}>{creating ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create link'}</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Manage Link (job-level) ──
   Lists every link already created for this job. Reachable only once at
   least one link exists — the More menu swaps "Create Link" for
   "Manage Link" the moment the first one is generated. */
function ManageLinkDialog({ links, open, onOpenChange, onEdit }: { links: JobLink[]; open: boolean; onOpenChange: (open: boolean) => void; onEdit: (link: JobLink) => void }) {
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[760px] w-[95vw] max-w-3xl flex-col overflow-hidden sm:h-[75vh]">
        <DialogHeader>
          <DialogTitle>Manage links</DialogTitle>
          <DialogDescription>{links.length} shareable link{links.length === 1 ? '' : 's'} for this job.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {links.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <LinkIcon className="h-6 w-6 text-muted" aria-hidden="true" />
              <p className="text-body-sm text-muted">No links yet.</p>
            </div>
          ) : links.map((link) => (
            <div key={link.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-semibold text-heading" title={link.name}>{link.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted">
                    <span>Created {link.createdAt}</span>
                    <span aria-hidden="true">·</span>
                    {link.pin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-wash px-2 py-0.5 font-medium text-success-ink"><KeyRound className="h-3 w-3" aria-hidden="true" />PIN protected</span>
                    ) : (
                      <span className="text-muted">No password</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(link)}>
                    <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-2 p-2 pl-3">
                <span className="block min-w-0 flex-1 truncate font-mono text-caption text-heading" title={link.url}>{link.url}</span>
                <button type="button" aria-label="Copy link" className="shrink-0 rounded-sm p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-heading" onClick={() => copyLink(link.url)}><Copy className="h-3.5 w-3.5" aria-hidden="true" /></button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupportingView({ view, candidate, comments, reviews }: { view: Exclude<CandidateView, 'Interview'>; candidate: Candidate; comments: TeamNote[]; reviews: TeamNote[] }) {
  if (view === 'Comments') {
    return <div className="rounded-lg border border-border bg-surface p-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-h2 text-heading">Comments</h2>
        <p className="mt-1 text-body-sm text-muted">{comments.length} from the hiring team.</p>
      </div>
      <div className="mt-4"><NoteList notes={comments} empty="No comments yet" variant="comment" /></div>
    </div>;
  }
  if (view === 'Reviews') {
    const average = reviews.length ? reviews.reduce((sum, r) => sum + (r.stars ?? 0), 0) / reviews.length : 0;
    return <div className="rounded-lg border border-border bg-surface p-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-h2 text-heading">Reviews</h2>
        {/* The headline rating is the mean of these reviews, so the number
            in the header and this list can never disagree. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-h2 tabular text-heading">{average.toFixed(1)}</span>
          <Stars value={average} />
          <span className="text-body-sm text-muted">from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
        </div>
      </div>
      <div className="mt-4"><NoteList notes={reviews} empty="No reviews yet" variant="review" /></div>
    </div>;
  }
  if (view === 'Resume') {
    return <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-jobs-wash-2 text-jobs-ink"><FileText className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="truncate text-h3 text-heading">{candidate.name}&apos;s resume</h2>
          <p className="text-caption font-normal text-muted">{RESUME_META.fileName} · {RESUME_META.pages} pages · {RESUME_META.sizeLabel}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild><a href={RESUME_URL} target="_blank" rel="noreferrer"><Maximize2 className="h-4 w-4" aria-hidden="true" />Open</a></Button>
          <Button variant="secondary" size="sm" asChild><a href={RESUME_URL} download={RESUME_META.fileName}><Download className="h-4 w-4" aria-hidden="true" />Download</a></Button>
        </div>
      </div>
      {/* The real document, not a summary of it. <object> falls back to the
          link inside it when a browser cannot render a PDF inline. */}
      <object data={`${RESUME_URL}#view=FitH`} type="application/pdf" className="min-h-[70vh] w-full flex-1 bg-surface-2" aria-label={`${candidate.name} resume`}>
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
          <FileText className="h-8 w-8 text-muted" aria-hidden="true" />
          <p className="text-body text-muted">This browser cannot display the PDF inline.</p>
          <Button variant="secondary" size="sm" asChild><a href={RESUME_URL} target="_blank" rel="noreferrer">Open the resume</a></Button>
        </div>
      </object>
    </div>;
  }
  const entries = ['Sarah Chen viewed the interview', 'AI report generated', 'A note was added by Michael Wong', 'Candidate completed question 6'];
  return <div className="rounded-lg border border-border bg-surface p-6"><h2 className="text-h2 text-heading">{view}</h2><p className="mt-1 text-body-sm text-muted">A clear record of everything the hiring team has done.</p><div className="mt-6 space-y-5 border-l border-border pl-5">{entries.map((entry, index) => <div key={entry} className="relative"><span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-primary" /><p className="text-body font-medium text-heading">{entry}</p><p className="mt-1 text-caption text-muted">{index === 0 ? 'Today, 10:24 AM' : `${index + 1} hours ago`} · Sarah Chen</p></div>)}</div></div>;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const jobId = params?.id ?? 'job-1';
  const job: Job | undefined = [...activeJobs, ...archivedJobs].find((item) => item.id === jobId);
  const stageFromUrl = searchParams.get('stage');
  const initialStage = workflowStages.find((stage) => stage.label === stageFromUrl)?.id ?? 'in-progress';
  const [stage, setStage] = React.useState(initialStage);
  const [candidate, setCandidate] = React.useState(workflowCandidates[0]);
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('newest');
  const [matchFilter, setMatchFilter] = React.useState<MatchLevel | 'all'>('all');
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());
  const [view, setView] = React.useState<CandidateView>('Interview');
  const [questionIndex, setQuestionIndex] = React.useState(1);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [comments, setComments] = React.useState<TeamNote[]>(candidateComments);
  const [reviews, setReviews] = React.useState<TeamNote[]>(candidateReviews);
  const [draft, setDraft] = React.useState('');
  const [draftStars, setDraftStars] = React.useState(0);
  const [jobLinks, setJobLinks] = React.useState<JobLink[]>([]);
  const [editingLink, setEditingLink] = React.useState<JobLink | null>(null);

  React.useEffect(() => { if (jobId) setJobLinks(getJobLinks(jobId)); }, [jobId]);

  /* The signed-in reviewer. Real auth would supply this. */
  const me = { author: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', initials: 'SC' };

  const openDialog = (next: DialogState) => { setDraft(''); setDraftStars(0); setDialog(next); };

  function submitNote() {
    if (!draft.trim()) return;
    const entry: TeamNote = { id: `${Date.now()}`, ...me, at: 'Just now', body: draft.trim() };
    if (dialog === 'note') {
      setReviews((current) => [{ ...entry, stars: draftStars || undefined }, ...current]);
      setView('Reviews');
      toast('Review added');
    } else {
      setComments((current) => [entry, ...current]);
      setView('Comments');
      toast('Comment added');
    }
    setDialog(null);
  }

  /* The headline rating follows the reviews, so the two can never disagree. */
  const averageRating = reviews.length ? reviews.reduce((sum, r) => sum + (r.stars ?? 0), 0) / reviews.length : undefined;
  const shownCandidate: Candidate = { ...candidate, rating: averageRating, reviews: reviews.length };

  type SimpleDialogKind = 'comment' | 'note' | 'report' | 'compare' | 'delete';
  const dialogCopy: Record<SimpleDialogKind, { title: string; description: string; confirm: string; destructive?: boolean; field?: 'text' }> = {
    comment: { title: 'Add a comment', description: 'Comments are visible to everyone on the hiring team.', confirm: 'Post comment', field: 'text' },
    note: { title: 'Add a review', description: 'Rate this candidate and share what informed your view.', confirm: 'Post review', field: 'text' },
    report: { title: 'Generate AI report', description: `Build a combined report for ${checkedIds.size} selected candidates.`, confirm: 'Generate report' },
    compare: { title: 'Compare candidates', description: 'Select up to three completed AI reports to compare side by side.', confirm: 'Compare' },
    delete: { title: `Reject ${candidate.name}?`, description: 'They will move to the Rejected stage. You can restore them later.', confirm: 'Reject candidate', destructive: true },
  };
  const shareMode = dialog === 'share' ? 'single' : dialog === 'share-bulk' ? 'bulk' : null;
  const isSimpleDialog = (value: DialogState): value is SimpleDialogKind => value !== null && value in dialogCopy;
  const copy = isSimpleDialog(dialog) ? dialogCopy[dialog] : null;

  React.useEffect(() => { setStage(initialStage); }, [initialStage]);

  const updateStage = (nextStage: WorkflowStage) => { setStage(nextStage.id); router.replace(`/jobs/${jobId}?stage=${encodeURIComponent(nextStage.label)}`); };
  const toggleCandidate = (id: string, checked: boolean) => setCheckedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  const selectAll = () => setCheckedIds(new Set(workflowCandidates.map((item) => item.id)));
  const clearSelected = () => setCheckedIds(new Set());

  if (!job) return <div className="flex h-full items-center justify-center bg-background p-6"><div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm"><h1 className="text-h1 text-heading">Job not found</h1><Button className="mt-4" onClick={() => router.push('/jobs')}>Back to jobs</Button></div></div>;

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 lg:px-6"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon-sm" aria-label="Back to jobs" onClick={() => router.push('/jobs')}><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="secondary" className="max-w-64 justify-between"><BriefcaseIcon /><span className="truncate">{job.title}</span><ChevronDown className="h-4 w-4" aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start">{activeJobs.map((item) => <DropdownMenuItem key={item.id} onSelect={() => router.push(`/jobs/${item.id}`)}>{item.title}{item.id === job.id && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></div><div className="flex shrink-0 items-center gap-2"><Button variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => toast('Invite candidate opened')}><UserRoundPlus className="h-4 w-4" aria-hidden="true" />Invite candidate</Button><Button size="sm" className="max-sm:w-9 max-sm:px-0" aria-label="Edit job" onClick={() => toast('Edit job opened')}><FolderOpen className="h-4 w-4" aria-hidden="true" /><span className="max-sm:hidden">Edit job</span></Button></div></div><div className="shrink-0 overflow-x-auto overscroll-contain"><StageTabs selected={stage} onChange={updateStage} /></div>
      {/* Two regions side by side: the candidate list runs the full height from
          the stage tabs down, while everything about the selected candidate —
          header, tabs, answer, question rail — lives in the region beside it.
          The header spans that region only, so the list still starts at the
          top and the rail begins below the header. */}
      <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
        <CandidateList candidates={workflowCandidates} selectedCandidate={candidate} checkedIds={checkedIds} query={query} sort={sort} matchFilter={matchFilter} onQueryChange={setQuery} onSortChange={setSort} onMatchFilterChange={setMatchFilter} onSelect={(next) => { setCandidate(next); setQuestionIndex(1); }} onCheck={toggleCandidate} onSelectAll={selectAll} onClear={clearSelected} />
        <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">
          <div className="shrink-0"><CandidateHeader candidate={shownCandidate} onDialog={openDialog} hasLinks={jobLinks.length > 0} /></div>
          <div className={cn('grid min-h-0 flex-1 lg:overflow-hidden', view === 'Interview' && 'xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]')}><main className="min-w-0 overflow-visible overscroll-contain bg-background lg:overflow-y-auto"><div className="border-b border-border bg-surface px-4 sm:px-6"><div className="flex gap-6 overflow-x-auto" role="tablist" aria-label="Candidate detail views">{(['Interview', 'Resume', 'Comments', 'Reviews', 'Activity'] as CandidateView[]).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)} className={cn('-mb-px border-b-2 px-1 py-4 text-button transition-colors', view === item ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading')}>{item}</button>)}</div></div><div className="p-3 sm:p-4">{view === 'Interview' ? <InterviewView questionIndex={questionIndex} onQuestionChange={setQuestionIndex} onDialog={setDialog} onMove={(target) => toast(`${candidate.name} moved to ${target}`)} /> : <SupportingView view={view} candidate={candidate} comments={comments} reviews={reviews} />}{/* Clears the floating bulk bar (62px tall + 12px inset) so the last
              control is never trapped underneath it. */}{checkedIds.size > 0 && <div aria-hidden="true" className="h-[86px]" />}</div></main>{view === 'Interview' && <QuestionRail questionIndex={questionIndex} onQuestionChange={setQuestionIndex} />}</div></div></div>{checkedIds.size > 0 && <BulkActionBar count={checkedIds.size} onDialog={openDialog} onClear={clearSelected} />}
    <Dialog open={isSimpleDialog(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle>{copy?.title}</DialogTitle><DialogDescription>{copy?.description}</DialogDescription></DialogHeader>
        {dialog === 'note' && (
          <div>
            <p className="text-body-sm font-medium text-heading">Your rating</p>
            {/* Five empty stars until chosen — the picker starts unset so a
                review never carries a rating the reviewer did not give. */}
            <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((step) => (
                <button key={step} type="button" role="radio" aria-checked={draftStars === step} aria-label={`${step} star${step === 1 ? '' : 's'}`} onClick={() => setDraftStars(step)} className="rounded-sm p-0.5 transition-transform hover:scale-110">
                  <Star className={cn('h-6 w-6', step <= draftStars ? 'fill-warning text-warning' : 'fill-none text-border-strong')} aria-hidden="true" />
                </button>
              ))}
              {draftStars > 0 && <button type="button" className="ml-2 text-caption text-muted hover:text-heading" onClick={() => setDraftStars(0)}>Clear</button>}
            </div>
          </div>
        )}
        {copy?.field === 'text' && <Textarea rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={dialog === 'note' ? 'Share what stood out about this candidate...' : 'Write a comment for the hiring team...'} aria-label={copy.title} />}
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
          {copy?.field === 'text'
            ? <Button onClick={submitNote} disabled={!draft.trim()}>{copy.confirm}</Button>
            : <Button variant={copy?.destructive ? 'destructive' : 'default'} onClick={() => { toast(copy ? `${copy.confirm} done` : 'Done'); setDialog(null); }}>{copy?.confirm}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ShareDialog candidates={shareMode === 'bulk' ? workflowCandidates.filter((item) => checkedIds.has(item.id)) : [candidate]} open={Boolean(shareMode)} onOpenChange={(next) => setDialog(next ? dialog : null)} />
    <CreateLinkDialog
      key={dialog === 'edit-link' ? editingLink?.id : 'create'}
      jobId={job.id}
      mode={dialog === 'edit-link' ? 'edit' : 'create'}
      link={dialog === 'edit-link' ? editingLink : null}
      open={dialog === 'create-link' || dialog === 'edit-link'}
      onOpenChange={(open) => setDialog(open ? dialog : null)}
      onCreated={(link) => { setJobLinks((current) => [link, ...current]); }}
      onUpdated={(link) => { setJobLinks((current) => current.map((item) => (item.id === link.id ? link : item))); }}
    />
    <ManageLinkDialog
      links={jobLinks}
      open={dialog === 'manage-link'}
      onOpenChange={(open) => setDialog(open ? 'manage-link' : null)}
      onEdit={(link) => { setEditingLink(link); setDialog('edit-link'); }}
    />
  </div>;
}

function BriefcaseIcon() { return <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-jobs-wash-2 text-jobs-ink"><FolderOpen className="h-3.5 w-3.5" aria-hidden="true" /></span>; }

/* The bar sits on --heading, so its ghost buttons need inverse ink;
   the default ghost is muted-on-white and would vanish here. */
const barButton = 'text-text-inverse hover:bg-glass-bg-strong hover:text-text-inverse active:bg-glass-bg';

function BulkActionBar({ count, onDialog, onClear }: { count: number; onDialog: (dialog: DialogState) => void; onClear: () => void }) {
  return <div className="fixed inset-x-3 bottom-3 z-savebar mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg border border-heading bg-heading p-3 text-text-inverse shadow-xl"><div className="flex items-center gap-3"><span className="text-button font-medium text-text-inverse">{count} selected</span><button type="button" className="text-caption text-text-inverse/70 transition-colors hover:text-text-inverse" onClick={onClear}>Clear</button></div><div className="flex flex-wrap items-center gap-2"><Button variant="ghost" size="sm" className={barButton} onClick={() => onDialog('share-bulk')}><LinkIcon className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Share link</span></Button><Button variant="ghost" size="sm" className={barButton} onClick={() => toast(`Move ${count} candidates opened`)}><MoveRight className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Move</span></Button><Button variant="ghost" size="sm" className={barButton} onClick={() => onDialog('report')}><Sparkles className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">AI Report</span></Button><Button variant="ghost" size="sm" className={barButton} onClick={() => toast(`${count} candidates rejected`)}><X className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Reject</span></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className={barButton}><EllipsisVertical className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">More</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onDialog('compare')}><UsersIcon /><span className="ml-2">Compare candidates</span></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-error-ink focus:text-error-ink" onSelect={() => onDialog('delete')}><Trash2 className="mr-2 h-4 w-4" />Delete {count} candidates</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>;
}

function UsersIcon() { return <span className="flex items-center"><UserRound className="h-4 w-4" aria-hidden="true" /><UserRound className="-ml-2 h-3 w-3" aria-hidden="true" /></span>; }
