'use client';

import * as React from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Question } from '@/lib/api/jobs';

interface AiQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
  onImport: (questions: Question[]) => void;
}

type Counts = { video: number; audio: number; text: number; singleChoice: number };

export function AiQuestionDialog({
  open,
  onOpenChange,
  jobTitle,
  onImport,
}: AiQuestionDialogProps) {
  const [counts, setCounts] = React.useState<Counts>({
    video: 2,
    audio: 0,
    text: 1,
    singleChoice: 0,
  });
  const [generating, setGenerating] = React.useState(false);
  const [generated, setGenerated] = React.useState<Question[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const total = counts.video + counts.audio + counts.text + counts.singleChoice;
  const totalSelected = selected.size;

  const reset = () => {
    setGenerating(false);
    setGenerated(null);
    setSelected(new Set());
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleCountChange = (key: keyof Counts, value: number) => {
    const v = Math.max(0, Math.min(10, value));
    const newTotal = Object.entries(counts)
      .filter(([k]) => k !== key)
      .reduce((sum, [, val]) => sum + val, 0) + v;
    if (newTotal > 10) return;
    setCounts({ ...counts, [key]: v });
  };

  const handleGenerate = async () => {
    if (total === 0 || total > 10) return;
    setGenerating(true);
    setGenerated(null);
    try {
      // Dynamically import to avoid circular dependency
      const { generateAiQuestions } = await import('@/lib/api/jobs');
      const questions = await generateAiQuestions(
        { video: counts.video, audio: counts.audio, text: counts.text, singleChoice: counts.singleChoice },
        jobTitle
      );
      setGenerated(questions);
      setSelected(new Set(questions.map((q) => q.id)));
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGenerated(null);
    setSelected(new Set());
    handleGenerate();
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    if (!generated) return;
    const toImport = generated.filter((q) => selected.has(q.id));
    onImport(toImport);
    reset();
    onOpenChange(false);
  };

  const countFields: { key: keyof Counts; label: string }[] = [
    { key: 'video', label: 'Video' },
    { key: 'audio', label: 'Audio' },
    { key: 'text', label: 'Text' },
    { key: 'singleChoice', label: 'Single choice' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} strokeWidth={1.5} className="text-muted" />
            AI Generate Questions
          </DialogTitle>
          <DialogDescription>
            Choose how many of each type you&apos;d like. Up to 10 total.
          </DialogDescription>
        </DialogHeader>

        {!generated && !generating && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {countFields.map(({ key, label }) => (
                <div key={key}>
                  <Label className="mb-1.5 block text-body-sm font-medium text-heading">
                    {label}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={counts[key]}
                    onChange={(e) => handleCountChange(key, Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('text-body-sm', total > 10 ? 'text-error' : 'text-muted')}>
                Total: {total}/10
              </span>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={total === 0 || total > 10}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <Sparkles size={14} />
                Generate
              </button>
            </div>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted" />
            <p className="mt-3 text-body text-muted">Generating questions with AI…</p>
          </div>
        )}

        {generated && !generating && (
          <div className="space-y-3">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {generated.map((q) => (
                <label
                  key={q.id}
                  className={cn(
                    'flex items-start gap-3 rounded-md border p-3 transition-colors',
                    selected.has(q.id)
                      ? 'border-border-strong bg-[var(--background-200)]'
                      : 'border-border bg-surface hover:border-border-strong'
                  )}
                >
                  <Checkbox
                    checked={selected.has(q.id)}
                    onCheckedChange={() => handleToggleSelect(q.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-body text-heading">{q.title}</p>
                    {q.description && (
                      <p className="mt-0.5 text-body-sm text-muted">{q.description}</p>
                    )}
                    <span className="mt-1 inline-block rounded-full bg-muted-bg px-2 py-0.5 text-caption text-muted">
                      {q.type === 'single_choice' ? 'Single choice' : q.type}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={handleRegenerate}
                className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={totalSelected === 0}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <Check size={14} />
                Import {totalSelected} selected
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
