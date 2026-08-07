'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizard } from '@/components/wizard/wizard-context';
import { StepFooter } from '@/components/wizard/step-footer';
import { HeroBanner } from '@/components/wizard/hero-banner';
import { SectionCard } from '@/components/wizard/section-card';
import { QuestionCard, genId } from '@/components/wizard/question-card';
import { AiQuestionDialog } from '@/components/wizard/ai-question-dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  getQuestions,
  saveQuestions,
  getQuestionTemplates,
  getTemplateQuestions,
  type Question,
  type QuestionTemplate,
} from '@/lib/api/jobs';
import { track } from '@/lib/utils/analytics';
import { toast } from 'sonner';

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? null;
  const { job, patchJob } = useWizard();
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<QuestionTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const announceRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getQuestions(jobId)
      .then((qs) => {
        setQuestions(qs);
        if (qs.length > 0) setExpandedId(qs[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [jobId]);

  React.useEffect(() => {
    getQuestionTemplates().then(setTemplates).catch(() => {});
  }, []);

  const updateQuestion = (id: string, updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: genId(),
      type: 'video',
      title: '',
      description: '',
      retakesAllowed: 2,
      thinkingTime: '30s',
      answerTime: '2min',
    };
    setQuestions((prev) => [...prev, newQ]);
    setExpandedId(newQ.id);
    track('question_added', { type: 'video' });
  };

  const moveQuestion = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    if (announceRef.current) {
      announceRef.current.textContent = `Question moved to position ${to + 1} of ${questions.length}`;
    }
  };

  const handleKeyboardMove = (index: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? index - 1 : index + 1;
    moveQuestion(index, to);
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

  const handleTemplateChange = async (templateId: string) => {
    if (templateId === 'none') return;
    setTemplateLoading(true);
    try {
      const tplQuestions = await getTemplateQuestions(templateId);
      setQuestions(tplQuestions);
      if (tplQuestions.length > 0) setExpandedId(tplQuestions[0].id);
      const tpl = templates.find((t) => t.id === templateId);
      track('question_template_applied', { templateId, templateName: tpl?.name });
      toast.success(`Applied template: ${tpl?.name}`);
    } catch {
      toast.error('Could not load that template');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleAiImport = (imported: Question[]) => {
    setQuestions((prev) => [...prev, ...imported]);
    track('questions_ai_generated', { count: imported.length });
    toast.success(`Imported ${imported.length} question${imported.length > 1 ? 's' : ''}`);
  };

  const handleSaveAndContinue = async () => {
    if (questions.length === 0 || !jobId) return;
    setSaving(true);
    try {
      await saveQuestions(jobId, questions);
      patchJob({ description: job?.description ?? '' });
      router.push(`/jobs/${jobId}/edit/teams`);
    } catch {
      toast.error('Could not save questions');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = questions.length > 0;

  return (
    <div className="space-y-6">
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      <HeroBanner
        headline="What should candidates answer?"
        subtext="Build the question set the AI will evaluate against."
        step={2}
      />

      <SectionCard
        title="Interview questions"
        description="Candidates answer these in order. At least one is required."
        statusDot={canContinue ? 'success' : 'indigo'}
        statusTooltip={canContinue ? 'Complete' : 'At least one question is required'}
        headerAction={
          <button
            type="button"
            onClick={() => setAiDialogOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Sparkles size={16} />
            AI Generate Questions
          </button>
        }
        footer={
          <StepFooter
            onCancel={() => router.push('/jobs/new/setup')}
            onNext={handleSaveAndContinue}
            nextLabel="Next: Team"
            nextLoading={saving}
            nextDisabled={!canContinue}
            nextTooltip="Add at least one question to continue"
          />
        }
      >
        {/* Template selector */}
        <div className="mb-6">
          <Select defaultValue="none" onValueChange={handleTemplateChange}>
            <SelectTrigger className="h-9 w-full sm:w-56" disabled={templateLoading}>
              <SelectValue placeholder="Start from a template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.questionCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question list */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-border bg-card-hover"
                />
              ))}
            </div>
          ) : (
            questions.map((q, index) => (
              <div
                key={q.id}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                className={cn(
                  'relative transition-all',
                  dragIndex === index && 'opacity-50',
                  dropIndex === index && dragIndex !== index && 'pt-8'
                )}
              >
                {dropIndex === index && dragIndex !== index && (
                  <div className="absolute left-0 right-0 top-0 h-1 rounded-full bg-primary" />
                )}
                <QuestionCard
                  question={q}
                  index={index}
                  expanded={expandedId === q.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === q.id ? null : q.id)
                  }
                  onChange={(updated) => updateQuestion(q.id, updated)}
                  onRemove={() => removeQuestion(q.id)}
                  onMoveUp={() => moveQuestion(index, index - 1)}
                  onMoveDown={() => moveQuestion(index, index + 1)}
                  onKeyboardMove={(dir) => handleKeyboardMove(index, dir)}
                  dragHandleProps={{
                    draggable: true,
                    onDragStart: handleDragStart(index),
                    onDragEnd: handleDragEnd(),
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Add question button */}
        {!loading && (
          <button
            type="button"
            onClick={addQuestion}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-strong text-button text-muted transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus size={16} />
            Add question
          </button>
        )}

        {!loading && questions.length === 0 && (
          <p className="mt-4 text-center text-body-sm text-muted">
            No questions yet. Add one above or generate some with AI.
          </p>
        )}
      </SectionCard>

      <AiQuestionDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        jobTitle={job?.title ?? 'this role'}
        onImport={handleAiImport}
      />
    </div>
  );
}
