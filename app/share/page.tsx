'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Search, Sparkles, Star, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnswerModal, AnswerPlayer, QuestionNav, QuestionRail } from '@/components/interview/interview-parts';
import { aiOverview, interviewQuestions, workflowCandidates, RESUME_META, RESUME_URL, type Candidate } from '@/lib/workflow-mock';
import { cn } from '@/lib/utils';
import { BrandWordmark } from '@/components/ui/brand-mark';

/* ── Public share view ──
   Reached from a generated share link. It shows the same interview content as
   the internal page, minus everything that implies you work here: no stage
   rail, no pipeline actions, no AI match or rating, no browsing of other
   people's comments. A recipient can watch, read, and leave their own comment
   or review — nothing else.

   `?c=` limits the sidebar to the shared candidates; `?opts=` carries the
   toggles chosen when the link was made. */
type ShareView = 'Interview' | 'Resume';

function useShareParams() {
  const params = useSearchParams();
  const tokens = (params.get('c') ?? '').split(',').filter(Boolean);
  const opts = new Set((params.get('opts') ?? '').split(',').filter(Boolean));
  const shared = tokens.length ? workflowCandidates.filter((item) => tokens.includes(item.shareToken)) : workflowCandidates.slice(0, 3);
  return {
    candidates: shared.length ? shared : workflowCandidates.slice(0, 1),
    showName: opts.size === 0 || opts.has('name'),
    showResume: opts.size === 0 || opts.has('cv'),
    allowReview: opts.size === 0 || opts.has('review'),
    allowComments: opts.size === 0 || opts.has('comments'),
    showAi: opts.size === 0 || opts.has('aiReport'),
  };
}

function Wordmark() {
  return <BrandWordmark height={22} />;
}

function ShareView() {
  const { candidates, showName, showResume, allowReview, allowComments, showAi } = useShareParams();
  const [candidate, setCandidate] = React.useState<Candidate>(candidates[0]);
  const [query, setQuery] = React.useState('');
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [view, setView] = React.useState<ShareView>('Interview');
  const [dialog, setDialog] = React.useState<'comment' | 'review' | null>(null);
  const [draft, setDraft] = React.useState('');
  const [stars, setStars] = React.useState(0);
  const [answerOpen, setAnswerOpen] = React.useState<typeof interviewQuestions[number] | null>(null);

  const question = interviewQuestions[questionIndex];
  const filtered = candidates.filter((item) => (showName ? item.name : 'Candidate').toLowerCase().includes(query.toLowerCase()));
  const tabs: ShareView[] = showResume ? ['Interview', 'Resume'] : ['Interview'];

  /* Names are hidden when the sender turned that option off, so the view
     stays anonymous end to end — sidebar, header and dialogs alike. */
  const displayName = (item: Candidate) => (showName ? item.name : `Candidate ${candidates.indexOf(item) + 1}`);

  const submit = () => {
    if (!draft.trim()) return;
    toast(dialog === 'review' ? 'Review submitted' : 'Comment submitted');
    setDialog(null);
    setDraft('');
    setStars(0);
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Wordmark />
        <span className="text-body-sm text-muted">{candidates.length} candidate{candidates.length === 1 ? '' : 's'} shared</span>
      </header>

      <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex h-[40vh] min-h-0 flex-col overflow-hidden border-b border-border bg-surface p-3 lg:h-auto lg:border-b-0 lg:border-r">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidates..." aria-label="Search candidates" className="pl-9" />
          </div>
          <p className="mt-3 px-1 text-caption text-muted">{filtered.length} candidate{filtered.length === 1 ? '' : 's'}</p>
          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {filtered.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center text-center">
                <UserRound className="h-6 w-6 text-muted" aria-hidden="true" />
                <p className="mt-2 text-body-sm font-medium text-heading">No candidates found</p>
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setCandidate(item); setQuestionIndex(0); }}
                  aria-pressed={candidate.id === item.id}
                  className={cn('w-full rounded-md px-2 py-3 text-left transition-colors', candidate.id === item.id ? 'bg-primary-soft' : 'hover:bg-surface-hover')}
                >
                  <span className="block text-body-sm font-medium text-heading">{displayName(item)}</span>
                  <span className="mt-0.5 block truncate text-caption font-normal text-muted">{item.applied}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col lg:overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-border bg-surface px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h1 className="truncate text-h1 text-heading">{displayName(candidate)}</h1>
              <p className="mt-0.5 text-body text-muted">{candidate.title}</p>
              {showName && (
                <p className="mt-1.5 text-body-sm text-muted">{candidate.email} · {candidate.phone}</p>
              )}
            </div>
            {(allowComments || allowReview) && (
              <div className="flex items-center rounded-lg border border-border bg-surface p-1">
                {allowComments && (
                  <button type="button" onClick={() => setDialog('comment')} className="flex min-w-0 flex-col items-center gap-1.5 rounded-md px-3 py-2 text-caption font-normal text-muted transition-colors hover:bg-surface-hover hover:text-heading sm:min-w-[68px]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface"><MessageCircle className="h-4 w-4" /></span>
                    Comment
                  </button>
                )}
                {allowReview && (
                  <button type="button" onClick={() => setDialog('review')} className="flex min-w-0 flex-col items-center gap-1.5 rounded-md px-3 py-2 text-caption font-normal text-muted transition-colors hover:bg-surface-hover hover:text-heading sm:min-w-[68px]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface"><Star className="h-4 w-4" /></span>
                    Add Review
                  </button>
                )}
              </div>
            )}
          </div>

          {tabs.length > 1 && (
            <div className="shrink-0 border-b border-border bg-surface px-4 sm:px-6">
              <div className="flex gap-6" role="tablist" aria-label="Shared views">
                {tabs.map((item) => (
                  <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)} className={cn('-mb-px border-b-2 px-1 py-4 text-button transition-colors', view === item ? 'border-primary text-primary-ink' : 'border-transparent text-muted hover:text-heading')}>{item}</button>
                ))}
              </div>
            </div>
          )}

          <div className={cn('grid min-h-0 flex-1 lg:overflow-hidden', view === 'Interview' && 'xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]')}>
            <main className="min-w-0 overscroll-contain bg-background p-3 sm:p-4 lg:overflow-y-auto">
              {view === 'Interview' ? (
                <section className="min-w-0">
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <span className="text-body font-medium text-heading">Question {question.number} of {interviewQuestions.length}</span>
                    <QuestionNav questionIndex={questionIndex} onQuestionChange={setQuestionIndex} />
                  </div>
                  <AnswerPlayer question={question} />

                  <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0 rounded-md bg-primary-soft px-2 py-1 text-caption font-semibold text-primary-ink">Q{question.number}</span>
                      <h2 className="text-h3 text-heading">{question.text}</h2>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {question.type !== 'mcq' && <span className="rounded-full bg-surface-2 px-2 py-1 text-caption font-normal text-muted">Answer: {question.duration}</span>}
                      <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setAnswerOpen(question)}>View question details</Button>
                    </div>
                  </div>

                  {showAi && (
                    <div className="mt-3 rounded-lg border border-border bg-surface p-4">
                      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-ai-ink" aria-hidden="true" /><h2 className="text-h3 text-heading">AI Overview</h2></div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-5">
                        <div><p className="text-caption font-normal text-muted">Overall Verdict</p><p className="mt-1 text-h2 text-success-ink">{aiOverview.verdict}</p><p className="mt-1 text-body-sm text-muted">{aiOverview.summary}</p></div>
                        <div className="lg:border-l lg:border-border lg:pl-5"><p className="text-caption font-normal text-muted">Strengths</p><ul className="mt-2 space-y-1.5 text-body-sm text-heading">{aiOverview.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
                        <div className="lg:border-l lg:border-border lg:pl-5"><p className="text-caption font-normal text-muted">Areas to Improve</p><ul className="mt-2 space-y-1.5 text-body-sm text-heading">{aiOverview.improvements.map((s) => <li key={s}>{s}</li>)}</ul></div>
                      </div>
                    </div>
                  )}
                </section>
              ) : (
                <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
                  <div className="border-b border-border px-5 py-3">
                    <h2 className="text-h3 text-heading">Resume</h2>
                    <p className="text-caption font-normal text-muted">{RESUME_META.fileName} · {RESUME_META.pages} pages</p>
                  </div>
                  <object data={`${RESUME_URL}#view=FitH`} type="application/pdf" className="min-h-[70vh] w-full flex-1 bg-surface-2" aria-label="Candidate resume">
                    <div className="p-8 text-center text-body text-muted">This browser cannot display the PDF inline.</div>
                  </object>
                </div>
              )}
            </main>
            {view === 'Interview' && <QuestionRail questionIndex={questionIndex} onQuestionChange={setQuestionIndex} />}
          </div>
        </div>
      </div>

      <AnswerModal question={answerOpen} onClose={() => setAnswerOpen(null)} />

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => { if (!open) { setDialog(null); setDraft(''); setStars(0); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog === 'review' ? 'Add a review' : 'Add a comment'}</DialogTitle>
            <DialogDescription>{dialog === 'review' ? 'Rate this candidate and share what informed your view.' : 'Your comment goes back to the hiring team.'}</DialogDescription>
          </DialogHeader>
          {dialog === 'review' && (
            <div>
              <p className="text-body-sm font-medium text-heading">Your rating</p>
              <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((step) => (
                  <button key={step} type="button" role="radio" aria-checked={stars === step} aria-label={`${step} star${step === 1 ? '' : 's'}`} onClick={() => setStars(step)} className="rounded-sm p-0.5 transition-transform hover:scale-110">
                    <Star className={cn('h-6 w-6', step <= stars ? 'fill-warning text-warning' : 'fill-none text-border-strong')} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <Textarea rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={dialog === 'review' ? 'What stood out about this candidate?' : 'Write a comment...'} aria-label={dialog === 'review' ? 'Review' : 'Comment'} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={submit} disabled={!draft.trim()}>{dialog === 'review' ? 'Post review' : 'Post comment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SharePage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-background text-body text-muted">Loading shared interview...</div>}>
      <ShareView />
    </React.Suspense>
  );
}
