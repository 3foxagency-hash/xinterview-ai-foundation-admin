'use client';

import * as React from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import {
  QUESTION_TYPE_CONFIG,
  THINKING_TIME_OPTIONS,
  ANSWER_TIME_OPTIONS,
  RETAKES_OPTIONS,
  type QuestionType,
} from '@/lib/constants/question-types';
import { getAvailableQuestionTypes } from '@/lib/constants/question-types';
import type { InterviewFormat } from '@/lib/validation/job';
import type { Question, AnswerOption } from '@/lib/api/jobs';

function genId() {
  return `q_${Math.random().toString(36).slice(2, 12)}`;
}

function genOptId() {
  return `opt_${Math.random().toString(36).slice(2, 10)}`;
}

const TITLE_MAX = 180;
const DESC_MAX = 200;

interface QuestionEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  format: InterviewFormat;
  initialQuestion?: Question;
  onSave: (question: Question) => void;
}

export function QuestionEditorDrawer({
  open,
  onOpenChange,
  mode,
  format,
  initialQuestion,
  onSave,
}: QuestionEditorDrawerProps) {
  const availableTypes = getAvailableQuestionTypes(format);
  const defaultType = availableTypes[0];

  const [question, setQuestion] = React.useState<Question>(() =>
    initialQuestion ?? blankQuestion(defaultType)
  );
  const [touched, setTouched] = React.useState(false);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const [hasEdits, setHasEdits] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setQuestion(initialQuestion ?? blankQuestion(defaultType));
      setTouched(false);
      setHasEdits(false);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open, initialQuestion, defaultType]);

  const update = (patch: Partial<Question>) => {
    setQuestion((prev) => ({ ...prev, ...patch }));
    setHasEdits(true);
  };

  const handleTypeChange = (type: QuestionType) => {
    const newQ: Question = { ...question, type };
    if (type === 'single_choice' && !question.options) {
      newQ.options = [
        { id: genOptId(), text: '', isCorrect: true },
        { id: genOptId(), text: '', isCorrect: false },
      ];
    }
    if (type !== 'single_choice') {
      delete newQ.options;
      delete newQ.charLimit;
    }
    if (type !== 'text') {
      delete newQ.charLimit;
    }
    if (type === 'video' || type === 'audio') {
      if (newQ.retakesAllowed === undefined) newQ.retakesAllowed = 1;
      if (!newQ.thinkingTime) newQ.thinkingTime = '30s';
      if (!newQ.answerTime) newQ.answerTime = '2min';
    }
    if (type === 'text') {
      delete newQ.retakesAllowed;
      if (!newQ.answerTime) newQ.answerTime = '5min';
      if (!newQ.charLimit) newQ.charLimit = 500;
    }
    setQuestion(newQ);
    setHasEdits(true);
  };

  const handleOptionChange = (optId: string, text: string) => {
    if (!question.options) return;
    update({ options: question.options.map((o) => (o.id === optId ? { ...o, text } : o)) });
  };

  const handleCorrectChange = (optId: string) => {
    if (!question.options) return;
    update({ options: question.options.map((o) => ({ ...o, isCorrect: o.id === optId })) });
  };

  const handleRemoveOption = (optId: string) => {
    if (!question.options || question.options.length <= 2) return;
    update({ options: question.options.filter((o) => o.id !== optId) });
  };

  const handleAddOption = () => {
    if (!question.options || question.options.length >= 4) return;
    update({ options: [...question.options, { id: genOptId(), text: '', isCorrect: false }] });
  };

  const isSingleChoice = question.type === 'single_choice';
  const hasMinOptions = !isSingleChoice || (question.options?.length ?? 0) >= 2;
  const hasCorrect = !isSingleChoice || (question.options?.some((o) => o.isCorrect) ?? false);
  const hasTitle = question.title.trim().length >= 2;
  const canSave = hasTitle && hasMinOptions && hasCorrect;

  const saveBlockReason = !hasTitle
    ? 'Enter a question title to save'
    : !hasMinOptions
      ? 'Add at least two options to save'
      : !hasCorrect
        ? 'Mark one option as correct to save'
        : null;

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onSave(question);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && hasEdits) {
      const confirm = window.confirm('Discard your changes to this question?');
      if (!confirm) return;
    }
    onOpenChange(next);
  };

  const TypeIcon = QUESTION_TYPE_CONFIG[question.type].icon;
  const typeConfig = QUESTION_TYPE_CONFIG[question.type];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            {mode === 'add' ? 'Add question' : 'Edit question'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'add'
              ? 'Fill in the question and settings. Candidates will answer this in order.'
              : 'Update the question text and settings.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Type selector */}
            <div>
              <Label className="mb-2 block text-body-sm font-medium text-heading">
                Question type
              </Label>
              <Select
                value={question.type}
                onValueChange={(v) => handleTypeChange(v as QuestionType)}
                disabled={mode === 'edit'}
              >
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-2">
                    <TypeIcon size={16} className={typeConfig.colorClass} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => {
                    const cfg = QUESTION_TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={t} value={t}>
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={cfg.colorClass} />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {mode === 'edit' && (
                <p className="mt-1.5 text-caption text-muted">
                  Question type can&apos;t be changed after creation.
                </p>
              )}
            </div>

            {/* Question text */}
            <div>
              <Label className="mb-2 block text-body-sm font-medium text-heading">
                Question <span className="text-error">*</span>
              </Label>
              <Textarea
                ref={titleRef}
                value={question.title}
                onChange={(e) => update({ title: e.target.value })}
                maxLength={TITLE_MAX}
                placeholder="Enter your question"
                rows={3}
                aria-invalid={touched && !hasTitle}
                className={cn(touched && !hasTitle && 'border-error')}
              />
              <div className="mt-1 flex items-center justify-between">
                {touched && !hasTitle && (
                  <span role="alert" className="text-caption text-error">
                    Enter a question title.
                  </span>
                )}
                <span className="ml-auto text-caption tabular-nums text-muted">
                  {question.title.length}/{TITLE_MAX}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="mb-2 block text-body-sm font-medium text-heading">
                Description <span className="text-caption font-normal text-muted">(optional)</span>
              </Label>
              <Textarea
                value={question.description ?? ''}
                onChange={(e) => update({ description: e.target.value })}
                maxLength={DESC_MAX}
                placeholder="Add context or instructions shown to the candidate"
                rows={2}
              />
              <div className="mt-1 flex justify-end">
                <span className="text-caption tabular-nums text-muted">
                  {(question.description ?? '').length}/{DESC_MAX}
                </span>
              </div>
            </div>

            {/* Thinking time — all types */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Thinking time
                </Label>
                <Select
                  value={question.thinkingTime ?? 'none'}
                  onValueChange={(v) => update({ thinkingTime: v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THINKING_TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-caption text-muted">
                  Time the candidate sees the question before answering.
                </p>
              </div>

              {/* Answer time — video, audio, text */}
              {(question.type === 'video' || question.type === 'audio' || question.type === 'text') && (
                <div>
                  <Label className="mb-2 block text-body-sm font-medium text-heading">
                    Answer time{' '}
                    {isSingleChoice ? (
                      <span className="text-caption font-normal text-muted">(optional)</span>
                    ) : null}
                  </Label>
                  <Select
                    value={question.answerTime ?? '2min'}
                    onValueChange={(v) => update({ answerTime: v })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANSWER_TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Retakes — video and audio only */}
            {(question.type === 'video' || question.type === 'audio') && (
              <div className="sm:max-w-xs">
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Retries allowed
                </Label>
                <Select
                  value={String(question.retakesAllowed ?? 1)}
                  onValueChange={(v) => update({ retakesAllowed: Number(v) })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETAKES_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-caption text-muted">
                  How many times a candidate can re-record this answer.
                </p>
              </div>
            )}

            {/* Single choice options */}
            {isSingleChoice && (
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
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
                        {opt.isCorrect && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                      </button>
                      <Input
                        value={opt.text}
                        onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                        placeholder="Option text"
                        className="h-10 flex-1"
                      />
                      {question.options && question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          aria-label="Remove option"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-error-wash hover:text-error"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {question.options && question.options.length < 4 ? (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary hover:underline"
                  >
                    <Plus size={14} /> Add option
                  </button>
                ) : (
                  <p className="mt-2 text-caption text-muted">
                    Maximum of four options reached.
                  </p>
                )}
                {touched && !hasCorrect && (
                  <p role="alert" className="mt-2 text-body-sm text-error">
                    Mark exactly one option as correct.
                  </p>
                )}
                {touched && !hasMinOptions && (
                  <p role="alert" className="mt-2 text-body-sm text-error">
                    Add at least two options.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Cancel
          </button>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Save question
            </button>
            {!canSave && saveBlockReason && (
              <span className="text-caption text-muted">{saveBlockReason}</span>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function blankQuestion(type: QuestionType): Question {
  const base: Question = {
    id: genId(),
    type,
    title: '',
    description: '',
  };
  if (type === 'video' || type === 'audio') {
    base.retakesAllowed = 1;
    base.thinkingTime = '30s';
    base.answerTime = '2min';
  }
  if (type === 'text') {
    base.answerTime = '5min';
    base.charLimit = 500;
    base.thinkingTime = 'none';
  }
  if (type === 'single_choice') {
    base.thinkingTime = '30s';
    base.options = [
      { id: genOptId(), text: '', isCorrect: true },
      { id: genOptId(), text: '', isCorrect: false },
    ];
  }
  return base;
}
