'use client';

import * as React from 'react';
import { CircleHelp as HelpCircle, Info, Lightbulb, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  QUESTION_TYPE_CONFIG,
  parseTimeToSeconds,
  formatDuration,
  type QuestionType,
} from '@/lib/constants/question-types';
import type { Question } from '@/lib/api/jobs';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface QuestionsRailProps {
  questions: Question[];
  interviewDurationMinutes: number;
}

export function QuestionsRail({ questions, interviewDurationMinutes }: QuestionsRailProps) {
  const totalCount = questions.length;

  const typeCounts = React.useMemo(() => {
    const counts: Partial<Record<QuestionType, number>> = {};
    for (const q of questions) {
      const t = q.type as QuestionType;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [questions]);

  const estimatedSeconds = React.useMemo(() => {
    return questions.reduce((sum, q) => {
      const think = parseTimeToSeconds(q.thinkingTime);
      const answer = parseTimeToSeconds(q.answerTime);
      return sum + think + answer;
    }, 0);
  }, [questions]);

  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
  const exceedsDuration = estimatedMinutes > interviewDurationMinutes && totalCount > 0;

  return (
    <div className="space-y-4">
      {/* Step header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
          <HelpCircle size={18} className="text-bodyText" />
        </div>
        <div>
          <h2 className="text-h3 text-heading">Questions</h2>
          <p className="mt-0.5 text-body-sm text-muted">
            Add the questions candidates will answer.
          </p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-heading">Total questions</span>
          <span className="text-body-sm font-semibold tabular-nums text-heading">
            {totalCount}
          </span>
        </div>

        {/* Type breakdown */}
        {totalCount > 0 && (
          <>
            <div className="mt-3 space-y-2">
              {(Object.keys(typeCounts) as QuestionType[]).map((type) => {
                const cfg = QUESTION_TYPE_CONFIG[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', cfg.dotClass)} aria-hidden />
                      <span className="text-body-sm text-bodyText">{cfg.label}</span>
                    </div>
                    <span className="text-body-sm tabular-nums text-muted">
                      {typeCounts[type]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="my-3 h-px bg-border" />
          </>
        )}

        {/* Estimated time */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm font-medium text-heading">Estimated interview time</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted hover:text-bodyText" aria-label="How is estimated time calculated?">
                    <Info size={13} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  Thinking time plus answer time across all questions.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <p className="mt-1 text-h2 font-semibold tabular-nums text-heading">
          {totalCount > 0 ? formatDuration(estimatedSeconds) : '—'}
        </p>

        {/* Warning when exceeding duration */}
        {exceedsDuration && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-warning-border bg-warning-wash px-3 py-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning-ink" />
            <p className="text-caption text-warning-ink">
              This is longer than the {interviewDurationMinutes}-minute duration you set.
              Candidates will see the longer estimate.
            </p>
          </div>
        )}
      </div>

      {/* Tip card */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <h3 className="text-body-sm font-semibold text-heading">Tip</h3>
            <p className="mt-0.5 text-body-sm text-muted">
              Five to eight questions is usually enough. Long sets lower completion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
