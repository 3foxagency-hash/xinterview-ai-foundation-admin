'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Sparkles, MoveVertical as MoreVertical, FileText, Save, Trash2, Layers } from 'lucide-react';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { QuestionsSkeleton } from '@/components/wizard/questions-skeleton';
import { QuestionsRail } from '@/components/wizard/questions-rail';
import { QuestionRow } from '@/components/wizard/question-row';
import { QuestionEditorDrawer } from '@/components/wizard/question-editor-drawer';
import { AiQuestionPanel } from '@/components/wizard/ai-question-panel';
import { TemplatePickerDialog } from '@/components/wizard/template-picker-dialog';
import { SaveTemplateDialog } from '@/components/wizard/save-template-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  getQuestions,
  saveQuestions,
  getQuestionTemplates,
  type Question,
  type QuestionTemplate,
} from '@/lib/api/jobs';
import { INTERVIEW_FORMAT_CONFIG, TONE_TILE } from '@/lib/constants/interview-formats';
import { cn } from '@/lib/utils';
import {
  getAvailableQuestionTypes,
  QUESTION_TYPE_CONFIG,
  type QuestionType,
} from '@/lib/constants/question-types';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

function genId() {
  return `q_${Math.random().toString(36).slice(2, 12)}`;
}

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job, loading: wizardLoading, refreshQuestionCount, setSaveState, registerRetry } = useWizard();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<'add' | 'edit'>('add');
  const [editingQuestion, setEditingQuestion] = React.useState<Question | undefined>(undefined);
  const [aiPanelOpen, setAiPanelOpen] = React.useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = React.useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<QuestionTemplate[]>([]);
  const [continuing, setContinuing] = React.useState(false);
  const [continueError, setContinueError] = React.useState(false);

  // Drag state
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const announceRef = React.useRef<HTMLDivElement>(null);

  // Keyboard drag state
  const [keyboardGrabIndex, setKeyboardGrabIndex] = React.useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<Question | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = React.useState(false);

  // Autosave
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsRef = React.useRef(questions);
  questionsRef.current = questions;

  React.useEffect(() => {
    track('wizard_step_viewed', { step: 2 });
  }, []);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getQuestions(jobId)
      .then((qs) => setQuestions(qs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  React.useEffect(() => {
    getQuestionTemplates().then(setTemplates).catch(() => {});
  }, []);

  // Autosave
  const doAutosave = React.useCallback(
    async (toSave: Question[]) => {
      if (!jobId) return;
      setSaveState('saving');
      try {
        await saveQuestions(jobId, toSave);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [jobId, setSaveState]
  );

  React.useEffect(() => {
    registerRetry(() => {
      if (jobId) doAutosave(questionsRef.current);
    });
    return () => registerRetry(null);
  }, [registerRetry, doAutosave, jobId]);

  const scheduleAutosave = React.useCallback(
    (next: Question[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => doAutosave(next), 1000);
    },
    [doAutosave]
  );

  const updateQuestions = React.useCallback(
    (updater: (prev: Question[]) => Question[]) => {
      setQuestions((prev) => {
        const next = updater(prev);
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  // ─── Add / edit ───
  const handleAdd = (type: QuestionType) => {
    const availableTypes = getAvailableQuestionTypes(job?.format ?? 'ai_video');
    if (!availableTypes.includes(type)) return;
    setEditorMode('add');
    setEditingQuestion(undefined);
    setEditorOpen(true);
    track('question_added', { type });
  };

  const handleEdit = (question: Question) => {
    setEditorMode('edit');
    setEditingQuestion(question);
    setEditorOpen(true);
    track('question_edited');
  };

  const handleSaveQuestion = (question: Question) => {
    if (editorMode === 'add') {
      updateQuestions((prev) => [...prev, question]);
      toast.success('Question added');
    } else {
      updateQuestions((prev) => prev.map((q) => (q.id === question.id ? question : q)));
      toast.success('Question updated');
    }
  };

  const handleDuplicate = (question: Question) => {
    const copy: Question = {
      ...question,
      id: genId(),
      title: question.title,
      options: question.options?.map((o) => ({ ...o, id: `opt_${Math.random().toString(36).slice(2, 10)}` })),
    };
    updateQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === question.id);
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    track('question_duplicated');
    toast.success('Question duplicated');
  };

  // ─── Delete ───
  const handleDeleteRequest = (question: Question) => {
    if (question.title.trim()) {
      setDeleteTarget(question);
    } else {
      updateQuestions((prev) => prev.filter((q) => q.id !== question.id));
      track('question_deleted');
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const deleted = deleteTarget;
    updateQuestions((prev) => prev.filter((q) => q.id !== deleted.id));
    track('question_deleted');
    setDeleteTarget(null);
    toast.success('Question deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          updateQuestions((prev) => {
            const index = prev.findIndex((q) => q.id === deleted.id);
            const next = [...prev];
            if (index >= 0) next.splice(index, 0, deleted);
            else next.push(deleted);
            return next;
          });
        },
      },
    });
  };

  const handleDeleteAll = () => {
    setDeleteAllOpen(false);
    updateQuestions(() => []);
    track('question_deleted');
    toast.success('All questions deleted');
  };

  // ─── Reordering ───
  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questionsRef.current.length) return;
    updateQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    track('questions_reordered');
    if (announceRef.current) {
      announceRef.current.textContent = `Question moved to position ${to + 1}`;
    }
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => (_e: React.DragEvent) => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      moveQuestion(dragIndex, dropIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setDropIndex(index);
    }
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex !== null) {
      moveQuestion(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  // Keyboard reordering
  const handleKeyboardGrab = (index: number) => {
    setKeyboardGrabIndex(index);
    if (announceRef.current) {
      announceRef.current.textContent = `Question ${index + 1} picked up. Press up or down to move, space to drop, escape to cancel.`;
    }
  };

  const handleKeyboardMove = (index: number, direction: 'up' | 'down') => {
    if (keyboardGrabIndex === null) return;
    const to = direction === 'up' ? index - 1 : index + 1;
    if (to < 0 || to >= questionsRef.current.length) return;
    moveQuestion(index, to);
    setKeyboardGrabIndex(to);
  };

  const handleKeyboardDrop = () => {
    if (keyboardGrabIndex !== null) {
      if (announceRef.current) {
        announceRef.current.textContent = `Question dropped at position ${keyboardGrabIndex + 1}.`;
      }
    }
    setKeyboardGrabIndex(null);
  };

  const handleKeyboardCancel = () => {
    setKeyboardGrabIndex(null);
    if (announceRef.current) {
      announceRef.current.textContent = 'Reordering cancelled.';
    }
  };

  // ─── AI import ───
  const handleAiImport = (imported: Question[]) => {
    updateQuestions((prev) => [...prev, ...imported]);
    toast.success(`Added ${imported.length} ${imported.length === 1 ? 'question' : 'questions'}`);
  };

  // ─── Template import ───
  const handleTemplateImport = (tplQuestions: Question[], excludedCount: number, templateName: string) => {
    updateQuestions((prev) => [...prev, ...tplQuestions]);
    track('question_template_applied', { id: templateName, count: tplQuestions.length });
    if (excludedCount > 0) {
      toast.success(`Added ${tplQuestions.length} questions from "${templateName}"`, {
        description: `${excludedCount} ${excludedCount === 1 ? 'question was' : 'questions were'} left out — incompatible with this format.`,
      });
    } else {
      toast.success(`Added ${tplQuestions.length} questions from "${templateName}"`);
    }
  };

  // ─── Continue ───
  const handleContinue = async () => {
    if (!jobId || questions.length === 0) return;
    setContinuing(true);
    setContinueError(false);
    try {
      await saveQuestions(jobId, questions);
      refreshQuestionCount();
      router.push(`/jobs/${jobId}/edit/teams`);
    } catch {
      setContinueError(true);
    } finally {
      setContinuing(false);
    }
  };

  const format = job?.format ?? 'ai_video';
  const formatConfig = INTERVIEW_FORMAT_CONFIG.find((f) => f.id === format);
  const FormatIcon = formatConfig?.icon;
  const availableTypes = getAvailableQuestionTypes(format);
  const interviewDurationMinutes = parseInt(job?.interviewDuration ?? '30', 10);
  const canContinue = questions.length > 0;
  const hasTemplates = templates.length > 0;

  if (wizardLoading || loading) {
    return <QuestionsSkeleton />;
  }

  return (
    <div className="space-y-5 pb-20 md:pb-16">
      {/* Live region for screen reader announcements */}
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left rail — sticky on desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <QuestionsRail
              questions={questions}
              interviewDurationMinutes={interviewDurationMinutes}
            />
          </div>
        </div>

        {/* Mobile summary bar */}
        <div className="lg:hidden">
          <QuestionsRail
            questions={questions}
            interviewDurationMinutes={interviewDurationMinutes}
          />
        </div>

        {/* Main column — confined to the right column, not spanning above
            the left rail as well. */}
        <div className="space-y-5">
          {/* Format strip */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
            {FormatIcon && formatConfig && (
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  TONE_TILE[formatConfig.tone]
                )}
              >
                <FormatIcon size={16} />
              </div>
            )}
            <span className="text-body-sm font-semibold text-heading">
              {formatConfig?.name ?? 'Interview format'}
            </span>
            <span className="text-body-sm text-muted">
              — {formatConfig?.description ?? 'Candidates record their answers.'}
            </span>
          </div>

          {/* Question card */}
          <div className="rounded-lg border border-border bg-surface">
            {/* Card header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-h3 text-heading">
                Your questions{' '}
                <span className="text-body font-normal text-muted">({questions.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                {/* Add question with type menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <Plus size={15} />
                      Add question
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableTypes.map((type) => {
                      const cfg = QUESTION_TYPE_CONFIG[type];
                      const Icon = cfg.icon;
                      return (
                        <DropdownMenuItem key={type} onClick={() => handleAdd(type)}>
                          <Icon size={14} className={cfg.colorClass} />
                          {cfg.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  onClick={() => setAiPanelOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <Sparkles size={15} className="text-primary" />
                  <span className="hidden sm:inline">Generate with AI</span>
                </button>

                {/* Overflow menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More actions"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setTemplatePickerOpen(true)}
                      disabled={!hasTemplates}
                    >
                      <FileText size={14} /> Use a template
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSaveTemplateOpen(true)}
                      disabled={questions.length === 0}
                    >
                      <Save size={14} /> Save as template
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteAllOpen(true)}
                      disabled={questions.length === 0}
                      className="text-error"
                    >
                      <Trash2 size={14} /> Delete all questions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Question list or empty state */}
            <div className="p-4">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="max-w-md text-body text-muted">
                    Start from scratch, let AI draft a set, or reuse a template your team saved.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                        >
                          <Plus size={16} /> Add question
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {availableTypes.map((type) => {
                          const cfg = QUESTION_TYPE_CONFIG[type];
                          const Icon = cfg.icon;
                          return (
                            <DropdownMenuItem key={type} onClick={() => handleAdd(type)}>
                              <Icon size={14} className={cfg.colorClass} />
                              {cfg.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      type="button"
                      onClick={() => setAiPanelOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
                    >
                      <Sparkles size={16} className="text-primary" /> Generate with AI
                    </button>
                    {hasTemplates ? (
                      <button
                        type="button"
                        onClick={() => setTemplatePickerOpen(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
                      >
                        <Layers size={16} /> Use a template
                      </button>
                    ) : (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-md border border-border bg-surface px-4 text-button text-muted opacity-50"
                            >
                              <Layers size={16} /> Use a template
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            No templates saved yet. Save this set as a template to reuse it.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Ordered list */}
                  <ol className="space-y-2">
                    {questions.map((question, index) => (
                      <li key={question.id}>
                        <QuestionRow
                          question={question}
                          index={index}
                          isDragging={dragIndex === index}
                          isDropTarget={dropIndex === index && dragIndex !== index}
                          onDragStart={handleDragStart(index)}
                          onDragEnd={handleDragEnd()}
                          onDragOver={handleDragOver(index)}
                          onDrop={handleDrop(index)}
                          onEdit={() => handleEdit(question)}
                          onDuplicate={() => handleDuplicate(question)}
                          onDelete={() => handleDeleteRequest(question)}
                          onMoveUp={() => moveQuestion(index, index - 1)}
                          onMoveDown={() => moveQuestion(index, index + 1)}
                          onKeyboardGrab={() => handleKeyboardGrab(index)}
                          onKeyboardMove={(dir) => handleKeyboardMove(keyboardGrabIndex ?? index, dir)}
                          onKeyboardDrop={handleKeyboardDrop}
                          onKeyboardCancel={handleKeyboardCancel}
                          isKeyboardGrabbing={keyboardGrabIndex === index}
                        />
                      </li>
                    ))}
                  </ol>

                  {/* Dashed drop zone */}
                  <div className="mt-3 flex h-12 items-center justify-center rounded-lg border-2 border-dashed border-border text-body-sm text-muted">
                    Drag and drop to reorder questions
                  </div>

                  {/* Footer actions inside the card */}
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover"
                        >
                          <Plus size={15} /> Add question
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {availableTypes.map((type) => {
                          const cfg = QUESTION_TYPE_CONFIG[type];
                          const Icon = cfg.icon;
                          return (
                            <DropdownMenuItem key={type} onClick={() => handleAdd(type)}>
                              <Icon size={14} className={cfg.colorClass} />
                              {cfg.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      type="button"
                      onClick={() => setAiPanelOpen(true)}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover"
                    >
                      <Sparkles size={15} className="text-primary" /> Generate with AI
                    </button>
                    {hasTemplates ? (
                      <button
                        type="button"
                        onClick={() => setTemplatePickerOpen(true)}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-button text-heading transition-colors hover:bg-card-hover"
                      >
                        <Layers size={15} /> Use a template
                      </button>
                    ) : (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled
                              className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-border bg-surface px-3 text-button text-muted opacity-50"
                            >
                              <Layers size={15} /> Use a template
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            No templates saved yet. Save this set as a template to reuse it.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Continue error */}
      {continueError && (
        <div className="flex items-center justify-between rounded-md border border-error-border bg-error-wash px-4 py-3">
          <span className="text-body-sm text-error-ink">
            Couldn&apos;t save and continue. Try again.
          </span>
          <button
            type="button"
            onClick={handleContinue}
            className="text-body-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Footer */}
      <StepFooter
        onBack={() => router.push(jobId ? `/jobs/${jobId}/edit/setup` : '/jobs/new/setup')}
        backLabel="Back to job details"
        onNext={handleContinue}
        nextLabel="Continue to team"
        nextLoading={continuing}
        nextDisabled={!canContinue}
        nextTooltip="Add at least one question to continue"
      />

      {/* Continue disabled reason */}
      {!canContinue && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 text-body-sm text-muted">
          Add at least one question to continue.
        </div>
      )}

      {/* Question editor drawer */}
      <QuestionEditorDrawer
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        format={format}
        initialQuestion={editingQuestion}
        onSave={handleSaveQuestion}
      />

      {/* AI question panel */}
      <AiQuestionPanel
        open={aiPanelOpen}
        onOpenChange={setAiPanelOpen}
        format={format}
        jobTitle={job?.title ?? 'this role'}
        jobId={jobId}
        hasJobDescription={!!job?.description?.trim()}
        onImport={handleAiImport}
      />

      {/* Template picker */}
      <TemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        templates={templates}
        format={format}
        onImport={handleTemplateImport}
      />

      {/* Save as template */}
      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        questions={questions}
      />

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-q-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 id="delete-q-title" className="text-h2 text-heading">
              Delete this question?
            </h2>
            <p className="mt-2 text-body text-bodyText">
              This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                autoFocus
                className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex h-9 items-center rounded-md bg-error px-4 text-button text-error-foreground transition-colors hover:bg-error-ink"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all confirmation */}
      {deleteAllOpen && (
        <div
          className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-all-title"
        >
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-xl">
            <h2 id="delete-all-title" className="text-h2 text-heading">
              Delete all {questions.length} questions?
            </h2>
            <p className="mt-2 text-body text-bodyText">
              This removes every question from this job. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteAllOpen(false)}
                autoFocus
                className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="inline-flex h-9 items-center rounded-md bg-error px-4 text-button text-error-foreground transition-colors hover:bg-error-ink"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
