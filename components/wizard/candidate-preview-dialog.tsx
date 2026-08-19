'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CandidatePreviewPanel } from '@/components/wizard/candidate-preview-panel';
import { useWizard } from '@/components/wizard/wizard-context';

interface CandidatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle?: string;
}

export function CandidatePreviewDialog({
  open,
  onOpenChange,
  jobTitle,
}: CandidatePreviewDialogProps) {
  const { job } = useWizard();
  const title = jobTitle ?? job?.title ?? 'Interview';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-0 overflow-hidden p-0 sm:max-w-[440px]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-h3">Candidate preview</DialogTitle>
          <DialogDescription className="text-body-sm">
            This is exactly what candidates see when they open your interview link.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[560px] overflow-hidden">
          <CandidatePreviewPanel jobTitle={title} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
