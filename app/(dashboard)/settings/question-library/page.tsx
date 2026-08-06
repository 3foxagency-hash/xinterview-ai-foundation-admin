'use client';

import * as React from 'react';
import { ArrowLeft, FileQuestion, MoreHorizontal, Plus, Loader2 } from 'lucide-react';
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
import { QuestionCard, genId } from '@/components/wizard/question-card';
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

export default function QuestionLibraryPage() {
  const [templates, setTemplates] = React.useState<QuestionTemplateRecord[]>([]);
  const [companyName, setCompanyName] = React.useState<string>();
  const [loading, setLoading] = React.useState(true);

  /** null → template list; otherwise the id of the template being edited */
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Question[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
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
    setExpandedId(t.questions[0]?.id ?? null);
  };

  const closeTemplate = () => {
    setOpenId(null);
    setDraft([]);
    setExpandedId(null);
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
    setExpandedId(id);
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
      <div className="mx-auto w-full max-w-[800px] px-8 py-8">
        <button
          type="button"
          onClick={closeTemplate}
          className="inline-flex items-center gap-1.5 rounded text-body-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft size={14} />
          All templates
        </button>

        <h1 className="mt-4 text-h1 text-heading">{openRecord.name}</h1>
        <p className="mt-2 text-body text-bodyText">
          {openRecord.description || 'Add the questions this template should include.'}
        </p>

        <div className="mt-8 space-y-4">
          {draft.map((q, index) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              expanded={expandedId === q.id}
              onToggleExpand={() => setExpandedId(expandedId === q.id ? null : q.id)}
              onChange={(updated) => updateQuestion(q.id, updated)}
              onRemove={() => removeQuestion(q.id)}
              onMoveUp={() => moveQuestion(index, index - 1)}
              onMoveDown={() => moveQuestion(index, index + 1)}
              onKeyboardMove={(dir) =>
                moveQuestion(index, dir === 'up' ? index - 1 : index + 1)
              }
              dragHandleProps={{
                draggable: false,
                onDragStart: () => {},
                onDragEnd: () => {},
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong text-button text-muted transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus size={16} />
          Add question
        </button>

        {draft.length === 0 && (
          <p className="mt-4 text-center text-body-sm text-muted">
            No questions in this template yet.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={closeTemplate}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveQuestions}
            disabled={savingQuestions}
            aria-busy={savingQuestions}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          >
            {savingQuestions && <Loader2 size={16} className="animate-spin" />}
            Save questions
          </button>
        </div>
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
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                    Template
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                    Questions
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-left text-caption font-semibold uppercase tracking-wider text-muted">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right text-caption font-semibold uppercase tracking-wider text-muted">
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
                          className="flex min-w-0 flex-col rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted-bg hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
