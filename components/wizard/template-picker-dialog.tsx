'use client';

import * as React from 'react';
import { Loader as Loader2, Check, FileText, ChevronRight, CircleAlert as AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  QUESTION_TYPE_CONFIG,
  type QuestionType,
} from '@/lib/constants/question-types';
import { getAvailableQuestionTypes } from '@/lib/constants/question-types';
import type { InterviewFormat } from '@/lib/validation/job';
import type { Question, QuestionTemplate } from '@/lib/api/jobs';
import { getTemplateDetails } from '@/lib/api/jobs';
import { formatDistanceToNow } from 'date-fns';

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: QuestionTemplate[];
  format: InterviewFormat;
  onImport: (questions: Question[], excludedCount: number, templateName: string) => void;
}

export function TemplatePickerDialog({
  open,
  onOpenChange,
  templates,
  format,
  onImport,
}: TemplatePickerDialogProps) {
  const availableTypes = getAvailableQuestionTypes(format);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [previewQuestions, setPreviewQuestions] = React.useState<Question[]>([]);
  const [previewTemplate, setPreviewTemplate] = React.useState<QuestionTemplate | null>(null);
  const [excludedCount, setExcludedCount] = React.useState(0);
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setPreviewQuestions([]);
      setPreviewTemplate(null);
      setExcludedCount(0);
    }
  }, [open]);

  const handleSelect = async (templateId: string) => {
    setSelectedId(templateId);
    setLoading(true);
    try {
      const { template, questions } = await getTemplateDetails(templateId);
      const compatible = questions.filter((q) =>
        availableTypes.includes(q.type as QuestionType)
      );
      const excluded = questions.length - compatible.length;
      setPreviewQuestions(compatible);
      setPreviewTemplate(template);
      setExcludedCount(excluded);
    } catch {
      setPreviewQuestions([]);
      setPreviewTemplate(null);
      setExcludedCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!selectedId || !previewTemplate) return;
    setImporting(true);
    setTimeout(() => {
      const newQuestions = previewQuestions.map((q) => ({
        ...q,
        id: `q_${Math.random().toString(36).slice(2, 12)}`,
      }));
      onImport(newQuestions, excludedCount, previewTemplate.name);
      setImporting(false);
      onOpenChange(false);
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} className="text-muted" />
            Use a template
          </DialogTitle>
          <DialogDescription>
            Pick a saved template to append its questions to your set.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Template list */}
          <div className="space-y-2">
            {templates.length === 0 ? (
              <p className="py-8 text-center text-body-sm text-muted">
                No templates saved yet. Save this set as a template to reuse it.
              </p>
            ) : (
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelect(tpl.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                    selectedId === tpl.id
                      ? 'border-primary bg-active-menu-bg'
                      : 'border-border bg-surface hover:border-border-strong'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-heading">{tpl.name}</p>
                    <p className="mt-0.5 text-caption text-muted">
                      {tpl.questionCount} questions
                      {tpl.lastUsedAt && (
                        <> · used {formatDistanceToNow(new Date(tpl.lastUsedAt), { addSuffix: true })}</>
                      )}
                    </p>
                  </div>
                  {selectedId === tpl.id && <Check size={16} className="shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-border bg-surface p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted" />
              </div>
            ) : selectedId && previewQuestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-body-sm font-medium text-heading">Preview</p>
                <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
                  {previewQuestions.map((q, i) => {
                    const cfg = QUESTION_TYPE_CONFIG[q.type as QuestionType];
                    return (
                      <div key={q.id} className="flex items-start gap-2 py-1">
                        <span className="w-4 shrink-0 text-caption tabular-nums text-muted">
                          {i + 1}
                        </span>
                        <cfg.icon size={12} className={cn('mt-0.5 shrink-0', cfg.colorClass)} />
                        <span className="text-body-sm text-bodyText line-clamp-2">{q.title}</span>
                      </div>
                    );
                  })}
                </div>
                {excludedCount > 0 && (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-warning-border bg-warning-wash px-3 py-2">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-warning-ink" />
                    <p className="text-caption text-warning-ink">
                      {excludedCount} {excludedCount === 1 ? 'question was' : 'questions were'} left out — this is a {format === 'ai_video' ? 'video' : format === 'ai_voice' ? 'audio' : 'text'} interview.
                    </p>
                  </div>
                )}
              </div>
            ) : selectedId ? (
              <p className="py-8 text-center text-body-sm text-muted">
                No compatible questions in this template.
              </p>
            ) : (
              <p className="py-8 text-center text-body-sm text-muted">
                Select a template to preview its questions.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!selectedId || previewQuestions.length === 0 || importing}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            Import questions
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
