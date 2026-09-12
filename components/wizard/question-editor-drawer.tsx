'use client';

import * as React from 'react';
import { Plus, X, Trash2, Lightbulb, Info, Clock, Timer, RotateCcw, Pencil } from 'lucide-react';
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

/** Icon + single line of muted copy on a soft background, used under an
 *  input to nudge the user without the weight of a full tip card. */
function TipRow({ icon: Icon, tone, children }: { icon: React.ElementType; tone: 'primary' | 'muted'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'mt-2 flex items-center gap-2 rounded-md px-3 py-2',
        tone === 'primary' ? 'bg-active-menu-bg' : 'bg-card-hover'
      )}
    >
      <Icon size={14} className={cn('shrink-0', tone === 'primary' ? 'text-primary' : 'text-muted')} />
      <p className="text-caption text-muted">{children}</p>
    </div>
  );
}

/** Small circular icon accent placed beside a Select trigger. */
function FieldIcon({ icon: Icon, tone }: { icon: React.ElementType; tone: 'muted' | 'success' | 'warning' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-success-wash text-success'
      : tone === 'warning'
        ? 'bg-warning-wash text-warning'
        : 'bg-card-hover text-muted';
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClass)}>
      <Icon size={15} />
    </div>
  );
}

interface QuestionEditorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  format: InterviewFormat;
  initialQuestion?: Question;
  /** Question type to preselect in add mode — the type the user picked
   *  from the "Add question" menu before this drawer opened. */
  initialType?: QuestionType;
  onSave: (question: Question) => void;
}

export function QuestionEditorDrawer({
  open,
  onOpenChange,
  mode,
  format,
  initialQuestion,
  initialType,
  onSave,
}: QuestionEditorDrawerProps) {
  const availableTypes = getAvailableQuestionTypes(format);
  const defaultType = initialType ?? availableTypes[0];

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
      if (newQ.retakesAllowed === undefined) newQ.retakesAllowed = 1;
      if (!newQ.answerTime) newQ.answerTime = '5min';
      if (!newQ.charLimit) newQ.charLimit = 500;
    }
    if (type === 'single_choice') {
      delete newQ.retakesAllowed;
      if (!newQ.answerTime) newQ.answerTime = '2min';
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
  const filledOptionCount = question.options?.filter((o) => o.text.trim().length > 0).length ?? 0;
  const hasMinOptions = !isSingleChoice || filledOptionCount >= 2;
  const hasCorrect = !isSingleChoice || (question.options?.some((o) => o.isCorrect) ?? false);
  const hasTitle = question.title.trim().length >= 2;
  const canSave = hasTitle && hasMinOptions && hasCorrect;

  const saveBlockReason = !hasTitle
    ? 'Enter a question title to save'
    : !hasMinOptions
      ? 'Fill in at least two options to save'
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-active-menu-bg text-primary">
              {mode === 'add' ? <Plus size={18} /> : <Pencil size={16} />}
            </div>
            <div>
              <SheetTitle>
                {mode === 'add' ? 'Add question' : 'Edit question'}
              </SheetTitle>
              <SheetDescription>
                {mode === 'add'
                  ? 'Fill in the question and settings. Candidates will answer this in order.'
                  : 'Update the question text and settings.'}
              </SheetDescription>
            </div>
          </div>
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
                <SelectTrigger className="h-auto py-2 [&>span]:flex-1 [&>span]:text-left">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t) => {
                    const cfg = QUESTION_TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={t} value={t} className="py-2 pl-8">
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', cfg.tileClass)}>
                            <Icon size={15} className={cfg.colorClass} />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-heading">{cfg.label}</p>
                            <p className="text-caption text-muted">{cfg.description}</p>
                          </div>
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
              <TipRow icon={Lightbulb} tone="primary">
                Be clear and specific to get better responses.
              </TipRow>
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
              <TipRow icon={Info} tone="muted">
                Use this to provide additional context, evaluation criteria or other instructions.
              </TipRow>
            </div>

            {/* Thinking time — all types */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Thinking time
                </Label>
                <div className="flex items-center gap-3">
                  <FieldIcon icon={Clock} tone="muted" />
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
                </div>
                <p className="mt-1.5 text-caption text-muted">
                  Time the candidate sees the question before answering.
                </p>
              </div>

              {/* Answer time — every type */}
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Answer time{' '}
                  {isSingleChoice ? (
                    <span className="text-caption font-normal text-muted">(optional)</span>
                  ) : null}
                </Label>
                <div className="flex items-center gap-3">
                  <FieldIcon icon={Timer} tone="success" />
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
                <p className="mt-1.5 text-caption text-muted">
                  Maximum time the candidate can record their answer.
                </p>
              </div>
            </div>

            {/* Retakes — video, audio and text */}
            {(question.type === 'video' || question.type === 'audio' || question.type === 'text') && (
              <div>
                <Label className="mb-2 block text-body-sm font-medium text-heading">
                  Retries allowed
                </Label>
                <div className="flex items-center gap-3">
                  <FieldIcon icon={RotateCcw} tone="warning" />
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
                </div>
                <p className="mt-1.5 text-caption text-muted">
                  {question.type === 'text'
                    ? 'How many times a candidate can redo this answer.'
                    : 'How many times a candidate can re-record this answer.'}
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
                        aria-invalid={touched && !opt.text.trim()}
                        className={cn('h-10 flex-1', touched && !opt.text.trim() && 'border-error')}
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
                    Fill in at least two options.
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
    base.retakesAllowed = 1;
    base.answerTime = '5min';
    base.charLimit = 500;
    base.thinkingTime = 'none';
  }
  if (type === 'single_choice') {
    base.thinkingTime = '30s';
    base.answerTime = '2min';
    base.options = [
      { id: genOptId(), text: '', isCorrect: true },
      { id: genOptId(), text: '', isCorrect: false },
    ];
  }
  return base;
}
