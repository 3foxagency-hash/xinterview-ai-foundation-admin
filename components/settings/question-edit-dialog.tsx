'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { QuestionCard } from '@/components/wizard/question-card';
import type { Question } from '@/lib/api/jobs';

interface QuestionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  /** Position in the template, used for the "Question N" heading */
  index: number;
  onSave: (updated: Question) => void;
}

/**
 * Wraps the wizard's QuestionCard in a dialog so a template question can be
 * edited from the library table without leaving the list.
 */
export function QuestionEditDialog({
  open,
  onOpenChange,
  question,
  index,
  onSave,
}: QuestionEditDialogProps) {
  const [draft, setDraft] = React.useState<Question | null>(question);

  // Seed only when the dialog opens so edits aren't clobbered mid-flow.
  const questionRef = React.useRef(question);
  questionRef.current = question;
  React.useEffect(() => {
    if (!open) return;
    setDraft(questionRef.current ? { ...questionRef.current } : null);
  }, [open]);

  if (!question || !draft) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Question {index + 1}</DialogTitle>
          <DialogDescription className="text-body text-muted">
            Set the prompt, type and timing for this question.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <QuestionCard
            question={draft}
            index={index}
            expanded
            onToggleExpand={() => {}}
            onChange={setDraft}
            onRemove={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onKeyboardMove={() => {}}
            dragHandleProps={{
              draggable: false,
              onDragStart: () => {},
              onDragEnd: () => {},
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
