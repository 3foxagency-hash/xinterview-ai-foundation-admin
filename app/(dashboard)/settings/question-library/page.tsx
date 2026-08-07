'use client';

import * as React from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsPage } from '@/components/settings';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TemplateDialog } from '@/components/settings/template-dialog';
import { DeleteTemplateDialog } from '@/components/settings/delete-template-dialog';
import { TemplateSkeleton } from '@/components/settings/template-skeleton';
import { genId } from '@/components/wizard/question-card';
import { QuestionEditDialog } from '@/components/settings/question-edit-dialog';
import {
  getQuestionTemplates,
  createQuestionTemplate,
  renameQuestionTemplate,
  deleteQuestionTemplate,
  saveTemplateQuestions,
  getOrganization,
  type QuestionTemplateRecord,
  type LibraryQuestion,
} from '@/lib/api/settings';
import { getSettingsErrorMessage } from '@/lib/errors/settings-messages';
import type { Question } from '@/lib/api/jobs';

/** Short enough to sit in the table's Type column without wrapping. */
const TYPE_LABEL: Record<Question['type'], string> = {
  video: 'Video',
  audio: 'Audio',
  text: 'Text',
  single_choice: 'Choice',
};

export default function QuestionLibraryPage() {
  const [templates, setTemplates] = React.useState<QuestionTemplateRecord[]>([]);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  /** null → template list; otherwise the id of the template being edited */
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Question[]>([]);
  /** Row index being edited in the question dialog, or null */
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [savingQuestions, setSavingQuestions] = React.useState(false);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<QuestionTemplateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<QuestionTemplateRecord | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, org] = await Promise.all([getQuestionTemplates(), getOrganization()]);
        if (cancelled) return;
        setTemplates(list);
        setCompanyName(org.name);
      } catch (e) {
        if (!cancelled) toast.error(getSettingsErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openTemplate = (t: QuestionTemplateRecord) => {
    setOpenId(t.id);
    setDraft(t.questions.map((q) => ({ ...q })) as Question[]);
    setEditIndex(null);
  };

  const closeTemplate = () => {
    setOpenId(null);
    setDraft([]);
    setEditIndex(null);
  };

  const handleCreate = async (name: string, description: string) => {
    const created = await createQuestionTemplate(name, description);
    setTemplates((prev) => [created, ...prev]);
    toast.success(`Template "${created.name}" added`);
  };

  const handleRename = async (name: string, description: string) => {
    if (!editTarget) return;
    const updated = await renameQuestionTemplate(editTarget.id, name, description);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    toast.success('Template updated');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteQuestionTemplate(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      if (openId === deleteTarget.id) closeTemplate();
      toast.success(`Template "${deleteTarget.name}" deleted`);
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaveQuestions = async () => {
    if (!openId) return;
    setSavingQuestions(true);
    try {
      const updated = await saveTemplateQuestions(openId, draft as LibraryQuestion[]);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Questions saved');
    } catch (e) {
      toast.error(getSettingsErrorMessage(e));
    } finally {
      setSavingQuestions(false);
    }
  };

  const addQuestion = () => {
    const id = genId();
    // Open the new row straight away so it can be filled in.
    setEditIndex(draft.length);
    setDraft((prev) => [
      ...prev,
      {
        id,
        type: 'video',
        title: '',
        description: '',
        retakesAllowed: 1,
        thinkingTime: '30s',
        answerTime: '2m',
      } as Question,
    ]);
  };

  const updateQuestion = (id: string, updated: Question) =>
    setDraft((prev) => prev.map((q) => (q.id === id ? updated : q)));

  const removeQuestion = (id: string) =>
    setDraft((prev) => prev.filter((q) => q.id !== id));

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= draft.length) return;
    setDraft((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  if (loading) return <TemplateSkeleton />;

  const openRecord = templates.find((t) => t.id === openId) ?? null;

  // ── Question editor: replaces the table for the selected template ──
  if (openRecord) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[800px] px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={closeTemplate}
          className="inline-flex items-center gap-1.5 rounded text-body-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft size={14} />
          All templates
        </button>

        <h1 className="mt-4 text-h1 text-heading">{openRecord.name}</h1>
        <p className="mt-2 text-body text-bodyText">
          {openRecord.description || 'Add the questions this template should include.'}
        </p>

        {/* Same table shape as the template list — the rows are now questions. */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="text-body-sm text-bodyText">
            {draft.length} question{draft.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={addQuestion}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Add question
          </button>
        </div>

        {draft.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border bg-surface px-4 py-10 text-center">
            <FileQuestion size={24} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-body text-heading">No questions yet</p>
            <p className="mt-1 text-body-sm text-muted">
              Add one to build out this template.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[560px] table-fixed">
              <thead>
                <tr className="border-b border-border bg-muted-bg">
                  <th scope="col" className="w-[44%] px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Question
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Retakes
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-caption font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {draft.map((q, index) => (
                  <tr
                    key={q.id}
                    className={cn(
                      'group transition-colors hover:bg-card-hover',
                      index > 0 && 'border-t border-border'
                    )}
                  >
                    {/* max-w keeps long prompts from stretching the table past
                        its container and clipping the Actions column. */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditIndex(index)}
                        className="flex w-full min-w-0 flex-col rounded text-left"
                      >
                        <span className="truncate text-body font-medium text-heading group-hover:text-primary">
                          {q.title || `Untitled question ${index + 1}`}
                        </span>
                        {q.description && (
                          <span className="truncate text-body-sm text-muted">
                            {q.description}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {/* "Multiple choice" is long; truncate rather than let it
                          bleed into the next column. */}
                      <span className="inline-block max-w-full truncate rounded-full border border-border bg-muted-bg px-2 py-0.5 text-caption text-bodyText">
                        {TYPE_LABEL[q.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm tabular-nums text-bodyText">
                      {q.type === 'text' || q.type === 'single_choice'
                        ? '—'
                        : (q.retakesAllowed ?? 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body-sm text-muted">
                      {q.type === 'text'
                        ? `${q.charLimit ?? 0} chars`
                        : q.type === 'single_choice'
                          ? '—'
                          : `${q.thinkingTime ?? '—'} + ${q.answerTime ?? '—'}`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditIndex(index)}
                          aria-label={`Edit question ${index + 1}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, index - 1)}
                          disabled={index === 0}
                          aria-label={`Move question ${index + 1} up`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, index + 1)}
                          disabled={index === draft.length - 1}
                          aria-label={`Move question ${index + 1} down`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading disabled:pointer-events-none disabled:opacity-30"
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          aria-label={`Remove question ${index + 1}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-error-banner-bg hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={closeTemplate}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveQuestions}
            disabled={savingQuestions}
            aria-busy={savingQuestions}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {savingQuestions && <Loader2 size={16} className="animate-spin" />}
            Save questions
          </button>
        </div>

        <QuestionEditDialog
          open={editIndex !== null}
          onOpenChange={(o) => {
            if (!o) setEditIndex(null);
          }}
          question={editIndex !== null ? draft[editIndex] ?? null : null}
          index={editIndex ?? 0}
          onSave={(updated) => updateQuestion(updated.id, updated)}
        />
      </div>
    );
  }

  // ── Template list ──
  return (
    <>
      <SettingsPage
        title="Question library"
        scope="company"
        companyName={companyName}
        description="Reusable question templates your team can apply when creating a job."
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="text-body-sm text-bodyText">
            {templates.length} template{templates.length === 1 ? '' : 's'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Add template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center">
            <FileQuestion size={24} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-body text-heading">No templates yet</p>
            <p className="mt-1 text-body-sm text-muted">
              Create one to reuse a set of questions across jobs.
            </p>
          </div>
        ) : (
          // overflow-x-auto keeps the Actions column reachable on narrower
          // screens instead of pushing the page into horizontal scroll.
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-muted-bg">
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Template
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Questions
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-medium text-muted">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-caption font-medium text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => {
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        'group transition-colors hover:bg-card-hover',
                        i > 0 && 'border-t border-border'
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openTemplate(t)}
                          className="flex min-w-0 flex-col rounded text-left"
                        >
                          <span className="truncate text-body font-medium text-heading group-hover:text-primary">
                            {t.name}
                          </span>
                          {t.description && (
                            <span className="truncate text-body-sm text-muted">
                              {t.description}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-body-sm tabular-nums text-bodyText">
                        {t.questions.length}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-muted">{t.updatedAt}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for ${t.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openTemplate(t)}>
                              Edit questions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditTarget(t);
                                setDialogOpen(true);
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-error focus:text-error"
                              onClick={() => setDeleteTarget(t)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SettingsPage>

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditTarget(null);
        }}
        initial={
          editTarget ? { name: editTarget.name, description: editTarget.description } : null
        }
        onSubmit={editTarget ? handleRename : handleCreate}
      />

      {deleteTarget && (
        <DeleteTemplateDialog
          open={!!deleteTarget}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          templateName={deleteTarget.name}
          questionCount={deleteTarget.questions.length}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
