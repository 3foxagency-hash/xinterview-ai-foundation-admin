'use client';

import * as React from 'react';
import { Sparkles, Loader as Loader2, Check, ChevronDown, ChevronRight, CircleAlert as AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  QUESTION_TYPE_CONFIG,
  type QuestionType,
} from '@/lib/constants/question-types';
import { getAvailableQuestionTypes } from '@/lib/constants/question-types';
import type { InterviewFormat } from '@/lib/validation/job';
import type { Question } from '@/lib/api/jobs';
import { generateAiQuestions } from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';

interface AiQuestionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: InterviewFormat;
  jobTitle: string;
  jobId: string | null;
  hasJobDescription: boolean;
  onImport: (questions: Question[]) => void;
}

type Counts = Record<QuestionType, number>;
/** Raw text per field while the user is typing — kept separate from the
 *  clamped numeric Counts so the input can be genuinely empty mid-edit
 *  instead of snapping to "0" and blocking further keystrokes. */
type CountInputs = Record<QuestionType, string>;

export function AiQuestionPanel({
  open,
  onOpenChange,
  format,
  jobTitle,
  jobId,
  hasJobDescription,
  onImport,
}: AiQuestionPanelProps) {
  const availableTypes = getAvailableQuestionTypes(format);
  const maxTotal = 10;

  const [counts, setCounts] = React.useState<Counts>(() => {
    const initial = { video: 0, audio: 0, text: 0, single_choice: 0 } as Counts;
    if (availableTypes.length > 0) {
      initial[availableTypes[0]] = 3;
      if (availableTypes.length > 1) initial[availableTypes[1]] = 2;
    }
    return initial;
  });
  const [countInputs, setCountInputs] = React.useState<CountInputs>(
    () => ({
      video: String(counts.video),
      audio: String(counts.audio),
      text: String(counts.text),
      single_choice: String(counts.single_choice),
    })
  );
  const [totalInput, setTotalInput] = React.useState(() =>
    String(availableTypes.reduce((sum, t) => sum + counts[t], 0))
  );
  const [optionsPerChoice, setOptionsPerChoice] = React.useState(3);
  const [focus, setFocus] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<Question[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [editedTitles, setEditedTitles] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState(false);

  const total = availableTypes.reduce((sum, t) => sum + counts[t], 0);
  const totalSelected = selected.size;
  const countsValid = total > 0 && total <= maxTotal;

  React.useEffect(() => {
    if (open) {
      track('questions_ai_panel_opened');
    }
  }, [open]);

  const reset = () => {
    setGenerating(false);
    setGenerated(null);
    setSelected(new Set());
    setExpanded(new Set());
    setEditedTitles({});
    setError(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Text field updates freely as the user types — including empty and
  // transiently-out-of-range values — so backspacing/retyping behaves like
  // a normal input. Clamping only happens on blur (handleCountBlur below).
  const handleCountInputChange = (type: QuestionType, raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setCountInputs((prev) => ({ ...prev, [type]: raw }));
    if (raw === '') return;
    const parsed = Number(raw);
    setCounts((prev) => ({ ...prev, [type]: parsed }));
  };

  const handleCountBlur = (type: QuestionType) => {
    const otherTotal = availableTypes
      .filter((t) => t !== type)
      .reduce((sum, t) => sum + counts[t], 0);
    const parsed = countInputs[type] === '' ? 0 : Number(countInputs[type]);
    const clamped = Math.max(0, Math.min(maxTotal - otherTotal, parsed));
    const next = { ...counts, [type]: clamped };
    setCounts(next);
    setCountInputs((prev) => ({ ...prev, [type]: String(clamped) }));
    setTotalInput(String(availableTypes.reduce((sum, t) => sum + next[t], 0)));
  };

  // "How many questions" edits the total directly; the per-type mix is
  // redistributed proportionally to match (evenly split if every type is
  // currently at 0, so a fresh total has somewhere to go).
  const handleTotalInputChange = (raw: string) => {
    if (raw !== '' && !/^\d+$/.test(raw)) return;
    setTotalInput(raw);
  };

  const handleTotalBlur = () => {
    const requested = totalInput === '' ? 0 : Number(totalInput);
    const clamped = Math.max(0, Math.min(maxTotal, requested));
    const currentTotal = availableTypes.reduce((sum, t) => sum + counts[t], 0);

    const next = { ...counts };
    if (clamped === 0) {
      availableTypes.forEach((t) => { next[t] = 0; });
    } else if (currentTotal === 0) {
      // Nothing to scale from — split as evenly as possible, remainder to the first type.
      const base = Math.floor(clamped / availableTypes.length);
      const remainder = clamped % availableTypes.length;
      availableTypes.forEach((t, i) => { next[t] = base + (i < remainder ? 1 : 0); });
    } else {
      // Scale each type's share of the current mix to the new total, then
      // patch any rounding drift onto the largest type so it sums exactly.
      let running = 0;
      availableTypes.forEach((t, i) => {
        const isLast = i === availableTypes.length - 1;
        const share = isLast ? clamped - running : Math.round((counts[t] / currentTotal) * clamped);
        next[t] = Math.max(0, share);
        running += next[t];
      });
    }

    setCounts(next);
    setCountInputs({
      video: String(next.video),
      audio: String(next.audio),
      text: String(next.text),
      single_choice: String(next.single_choice),
    });
    setTotalInput(String(availableTypes.reduce((sum, t) => sum + next[t], 0)));
  };

  const handleGenerate = async () => {
    if (!countsValid) return;
    setGenerating(true);
    setError(false);
    setGenerated(null);
    try {
      const questions = await generateAiQuestions(
        {
          video: counts.video,
          audio: counts.audio,
          text: counts.text,
          singleChoice: counts.single_choice,
        },
        jobTitle,
        jobId ?? undefined,
        focus || undefined,
        optionsPerChoice
      );
      setGenerated(questions);
      setSelected(new Set(questions.map((q) => q.id)));
      track('questions_ai_generated', { count: questions.length, mix: { ...counts }, optionsPerChoice });
    } catch {
      setError(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerated(null);
    setSelected(new Set());
    setExpanded(new Set());
    setEditedTitles({});
    await handleGenerate();
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (generated) setSelected(new Set(generated.map((q) => q.id)));
  };

  const handleClear = () => setSelected(new Set());

  const handleToggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEditTitle = (id: string, title: string) => {
    setEditedTitles((prev) => ({ ...prev, [id]: title }));
  };

  const handleImport = () => {
    if (!generated) return;
    const toImport = generated
      .filter((q) => selected.has(q.id))
      .map((q) => ({
        ...q,
        title: editedTitles[q.id] ?? q.title,
        id: `q_${Math.random().toString(36).slice(2, 12)}`,
      }));
    track('questions_ai_imported', { kept: toImport.length, discarded: generated.length - toImport.length });
    onImport(toImport);
    reset();
    onOpenChange(false);
  };

  const isConfigPhase = !generated && !generating && !error;
  const isGenerating = generating;
  const isReviewPhase = generated && !generating;
  const isError = error && !generating;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Generate with AI
          </SheetTitle>
          <SheetDescription>
            AI drafts questions based on your job title{hasJobDescription ? ', description' : ''} and experience level.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Config phase */}
          {isConfigPhase && (
            <div className="space-y-6">
              {!hasJobDescription && (
                <div className="flex items-start gap-2.5 rounded-md border border-info-border bg-info-wash px-3 py-2.5">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-info-ink" />
                  <p className="text-body-sm text-info-ink">
                    Adding a job description in Step 1 produces sharper questions.
                  </p>
                </div>
              )}

              {/* How many questions */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-body-sm font-medium text-heading">
                    How many questions
                  </Label>
                  <span className={cn('text-body-sm font-semibold tabular-nums', countsValid ? 'text-heading' : 'text-error')}>
                    {total}/{maxTotal}
                  </span>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={totalInput}
                  onChange={(e) => handleTotalInputChange(e.target.value)}
                  onBlur={handleTotalBlur}
                  className="mt-2 h-10 w-24"
                />
                <p className="mt-1.5 text-caption text-muted">
                  Changing this redistributes the mix below proportionally.
                </p>
                {!countsValid && total === 0 && (
                  <p className="mt-1.5 text-body-sm text-error">Select at least one question.</p>
                )}
              </div>

              {/* Mix by type */}
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Mix by type
                </Label>
                <div className="overflow-hidden rounded-lg border border-border">
                  {availableTypes.map((type, i) => {
                    const cfg = QUESTION_TYPE_CONFIG[type];
                    return (
                      <div
                        key={type}
                        className={cn(
                          'flex items-center justify-between gap-3 bg-surface px-3 py-2.5',
                          i > 0 && 'border-t border-border'
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', cfg.tileClass, cfg.colorClass)}>
                            <cfg.icon size={14} strokeWidth={1.5} />
                          </div>
                          <span className="text-body-sm font-medium text-heading">{cfg.label}</span>
                        </div>
                        <Input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Number of ${cfg.label.toLowerCase()} questions`}
                          value={countInputs[type]}
                          onChange={(e) => handleCountInputChange(type, e.target.value)}
                          onBlur={() => handleCountBlur(type)}
                          className="h-9 w-16 text-center"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Options per single-choice question — only relevant once at least one is requested */}
              {counts.single_choice > 0 && (
                <div>
                  <Label className="mb-2 block text-body-sm font-medium text-heading">
                    Answer options per single-choice question
                  </Label>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                    {[2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setOptionsPerChoice(n)}
                        aria-pressed={optionsPerChoice === n}
                        className={cn(
                          'flex h-8 flex-1 items-center justify-center rounded-md text-body-sm font-medium transition-colors',
                          optionsPerChoice === n
                            ? 'bg-active-menu-bg text-primary'
                            : 'text-muted hover:text-bodyText'
                        )}
                      >
                        {n} options
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-caption text-muted">
                    Applies to every single-choice question in this batch.
                  </p>
                </div>
              )}

              {/* Focus */}
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Focus <span className="text-caption font-normal text-muted">(optional)</span>
                </Label>
                <Textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. Emphasise system design and communication"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Generating */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="mt-4 text-body text-muted">Generating questions with AI…</p>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={28} className="text-error" />
              <p className="mt-4 text-body text-bodyText">
                Couldn&apos;t generate questions. Try again, or add them yourself.
              </p>
              <button
                type="button"
                onClick={handleRegenerate}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Try again
              </button>
            </div>
          )}

          {/* Review phase */}
          {isReviewPhase && generated && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-muted">
                  {generated.length} drafts · {totalSelected} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-body-sm font-medium text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-muted">·</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-body-sm font-medium text-muted hover:text-heading"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {generated.map((q) => {
                  const isSelected = selected.has(q.id);
                  const isExpanded = expanded.has(q.id);
                  const editedTitle = editedTitles[q.id] ?? q.title;
                  const cfg = QUESTION_TYPE_CONFIG[q.type as QuestionType];

                  return (
                    <div
                      key={q.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        isSelected ? 'border-primary bg-active-menu-bg' : 'border-border bg-surface'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(q.id)}
                          className="mt-0.5"
                          aria-label={`Select question: ${editedTitle}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', cfg.tileClass, cfg.colorClass)}>
                              <cfg.icon size={11} strokeWidth={1.5} />
                            </div>
                            <span className={cn('text-caption font-medium', cfg.colorClass)}>
                              {cfg.label}
                            </span>
                            {q.options && (
                              <span className="text-caption text-muted">
                                · {q.options.length} options
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => handleEditTitle(q.id, e.target.value)}
                            className="mt-1 w-full bg-transparent text-body text-heading focus:outline-none"
                            aria-label="Edit question title"
                          />
                          {q.description && (
                            <button
                              type="button"
                              onClick={() => handleToggleExpand(q.id)}
                              className="mt-1 flex items-center gap-1 text-caption text-muted hover:text-bodyText"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              {isExpanded ? 'Hide full text' : 'Show full text'}
                            </button>
                          )}
                          {isExpanded && q.description && (
                            <p className="mt-1.5 text-body-sm text-muted">{q.description}</p>
                          )}
                          {isExpanded && q.options && (
                            <ul className="mt-1.5 space-y-1">
                              {q.options.map((opt) => (
                                <li key={opt.id} className="flex items-center gap-1.5 text-body-sm text-muted">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" />
                                  {opt.text}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          {isConfigPhase && (
            <>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!countsValid}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <Sparkles size={15} />
                Generate
              </button>
            </>
          )}
          {isGenerating && (
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
          )}
          {isReviewPhase && (
            <>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={generating}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={totalSelected === 0}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <Check size={15} />
                Add {totalSelected} {totalSelected === 1 ? 'question' : 'questions'}
              </button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
