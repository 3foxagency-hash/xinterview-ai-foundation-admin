'use client';

import * as React from 'react';
import { GripVertical, ChevronDown, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question, AnswerOption } from '@/lib/api/jobs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Text',
  single_choice: 'Single choice',
};

const THINKING_TIMES = ['15s', '30s', '60s', '2min'];
const ANSWER_TIMES = ['30s', '1min', '2min', '3min', '5min'];
const RETAKES = [0, 1, 2, 3];

function genId() {
  return `q_${Math.random().toString(36).slice(2, 12)}`;
}

function genOptId() {
  return `opt_${Math.random().toString(36).slice(2, 10)}`;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (q: Question) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onKeyboardMove: (direction: 'up' | 'down') => void;
  dragHandleProps: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
  };
}

export function QuestionCard({
  question,
  index,
  expanded,
  onToggleExpand,
  onChange,
  onRemove,
  onKeyboardMove,
  dragHandleProps,
}: QuestionCardProps) {
  const titleRef = React.useRef<HTMLInputElement>(null);
  const gripRef = React.useRef<HTMLButtonElement>(null);
  const [optionsError, setOptionsError] = React.useState<string | null>(null);

  const update = (patch: Partial<Question>) => {
    onChange({ ...question, ...patch });
  };

  const validateOptions = (opts: AnswerOption[]) => {
    if (question.type !== 'single_choice') {
      setOptionsError(null);
      return true;
    }
    if (opts.length < 2) {
      setOptionsError('At least 2 options are required');
      return false;
    }
    if (!opts.some((o) => o.isCorrect)) {
      setOptionsError('Mark exactly one option as correct');
      return false;
    }
    setOptionsError(null);
    return true;
  };

  const handleTypeChange = (type: string) => {
    const newQ: Question = { ...question, type: type as Question['type'] };
    if (type === 'single_choice' && !question.options) {
      newQ.options = [
        { id: genOptId(), text: '', isCorrect: true },
        { id: genOptId(), text: '', isCorrect: false },
      ];
    }
    onChange(newQ);
  };

  const handleOptionChange = (optId: string, text: string) => {
    if (!question.options) return;
    const opts = question.options.map((o) => (o.id === optId ? { ...o, text } : o));
    update({ options: opts });
    validateOptions(opts);
  };

  const handleCorrectChange = (optId: string) => {
    if (!question.options) return;
    const opts = question.options.map((o) => ({
      ...o,
      isCorrect: o.id === optId,
    }));
    update({ options: opts });
    validateOptions(opts);
  };

  const handleRemoveOption = (optId: string) => {
    if (!question.options) return;
    const opts = question.options.filter((o) => o.id !== optId);
    update({ options: opts });
    validateOptions(opts);
  };

  const handleAddOption = () => {
    if (!question.options || question.options.length >= 4) return;
    const opts = [...question.options, { id: genOptId(), text: '', isCorrect: false }];
    update({ options: opts });
    validateOptions(opts);
  };

  const handleKeyboardMove = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
      e.preventDefault();
      onKeyboardMove('up');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
      e.preventDefault();
      onKeyboardMove('down');
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-surface',
        expanded ? 'border-primary/30 shadow-sm' : 'border-border'
      )}
    >
      {/* Header strip */}
      <div className="flex items-center gap-3 p-4">
        <button
          ref={gripRef}
          type="button"
          {...dragHandleProps}
          onKeyDown={handleKeyboardMove}
          aria-label={`Reorder question ${index + 1}. Press Ctrl or Cmd plus up or down arrow to move.`}
          className="flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-muted hover:text-bodyText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center text-left"
        >
          <h3 className="text-h3 text-heading">Question {index + 1}</h3>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Select value={question.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="h-8 w-32 text-body-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={expanded ? 'Collapse question' : 'Expand question'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-bodyText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronDown
              size={16}
              className={cn('transition-transform', expanded && 'rotate-180')}
            />
          </button>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove question ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-error-banner-bg hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Body when expanded */}
      {expanded && (
        <div className="space-y-4 border-t border-border px-4 pb-5 pt-4">
          {/* Title */}
          <div>
            <Label className="mb-1.5 block text-body-sm font-medium text-heading">
              Title <span className="text-error">*</span>
            </Label>
            <Input
              ref={titleRef}
              value={question.title}
              onChange={(e) => update({ title: e.target.value })}
              maxLength={180}
              placeholder="Enter your question"
              className="h-10"
            />
            <div className="mt-1 flex justify-end">
              <span className="text-caption text-muted">
                {question.title.length}/180
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1.5 block text-body-sm font-medium text-heading">
              Description
            </Label>
            <Textarea
              value={question.description ?? ''}
              onChange={(e) => update({ description: e.target.value })}
              maxLength={200}
              placeholder="Add context or instructions (optional)"
              className="min-h-[60px]"
            />
            <div className="mt-1 flex justify-end">
              <span className="text-caption text-muted">
                {(question.description ?? '').length}/200
              </span>
            </div>
          </div>

          {/* Type-specific settings */}
          {(question.type === 'video' || question.type === 'audio') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                  Retakes allowed
                </Label>
                <Select
                  value={String(question.retakesAllowed ?? 2)}
                  onValueChange={(v) => update({ retakesAllowed: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETAKES.map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r === 0 ? 'No retakes' : `${r} retake${r > 1 ? 's' : ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                  Thinking time
                </Label>
                <Select
                  value={question.thinkingTime ?? '30s'}
                  onValueChange={(v) => update({ thinkingTime: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THINKING_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                  Answer time
                </Label>
                <Select
                  value={question.answerTime ?? '2min'}
                  onValueChange={(v) => update({ answerTime: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANSWER_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {question.type === 'text' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                  Answer time
                </Label>
                <Select
                  value={question.answerTime ?? '5min'}
                  onValueChange={(v) => update({ answerTime: v })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANSWER_TIMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                  Character limit
                </Label>
                <Input
                  type="number"
                  value={question.charLimit ?? 500}
                  onChange={(e) => update({ charLimit: Number(e.target.value) })}
                  min={50}
                  max={5000}
                  className="h-9"
                />
              </div>
            </div>
          )}

          {question.type === 'single_choice' && (
            <div>
              <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                Answer options <span className="text-error">*</span>
              </Label>
              <div className="space-y-2">
                {question.options?.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCorrectChange(opt.id)}
                      aria-label={opt.isCorrect ? 'Correct answer (selected)' : 'Mark as correct answer'}
                      aria-pressed={opt.isCorrect}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        opt.isCorrect
                          ? 'border-primary bg-primary'
                          : 'border-border-strong hover:border-primary/50'
                      )}
                    >
                      {opt.isCorrect && (
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </button>
                    <Input
                      value={opt.text}
                      onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                      placeholder="Option text"
                      className="h-9 flex-1"
                    />
                    {question.options && question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        aria-label="Remove option"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-error-banner-bg hover:text-error"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {question.options && question.options.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline"
                >
                  <Plus size={14} />
                  Add option
                </button>
              )}
              {optionsError && (
                <p role="alert" className="mt-2 text-body-sm text-error">
                  {optionsError}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { genId, genOptId };
