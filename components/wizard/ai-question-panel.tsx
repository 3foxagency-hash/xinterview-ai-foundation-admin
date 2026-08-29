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

  const handleCountChange = (type: QuestionType, rawValue: number) => {
    const v = Math.max(0, Math.min(maxTotal, rawValue));
    const otherTotal = availableTypes
      .filter((t) => t !== type)
      .reduce((sum, t) => sum + counts[t], 0);
    if (otherTotal + v > maxTotal) return;
    setCounts((prev) => ({ ...prev, [type]: v }));
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
        focus || undefined
      );
      setGenerated(questions);
      setSelected(new Set(questions.map((q) => q.id)));
      track('questions_ai_generated', { count: questions.length, mix: { ...counts } });
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
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  How many questions
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={maxTotal}
                  value={total}
                  readOnly
                  className="h-10 w-24"
                />
                <p className="mt-1.5 text-caption text-muted">
                  Up to {maxTotal} questions per generation.
                </p>
              </div>

              {/* Mix by type */}
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Mix by type
                </Label>
                <div className="space-y-3">
                  {availableTypes.map((type) => {
                    const cfg = QUESTION_TYPE_CONFIG[type];
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div className={cn('flex items-center gap-1.5', cfg.colorClass)}>
                          <cfg.icon size={14} />
                          <span className="text-body-sm text-bodyText">{cfg.label}</span>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={maxTotal}
                          value={counts[type]}
                          onChange={(e) => handleCountChange(type, Number(e.target.value))}
                          className="h-9 w-20"
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={cn('text-body-sm', countsValid ? 'text-muted' : 'text-error')}>
                    Total: {total}/{maxTotal}
                  </span>
                  {!countsValid && total === 0 && (
                    <span className="text-body-sm text-error">
                      Select at least one question.
                    </span>
                  )}
                </div>
              </div>

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
                            <cfg.icon size={13} className={cn('shrink-0', cfg.colorClass)} />
                            <span className={cn('text-caption font-medium', cfg.colorClass)}>
                              {cfg.label}
                            </span>
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
