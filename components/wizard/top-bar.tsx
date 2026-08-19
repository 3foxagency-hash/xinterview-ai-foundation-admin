'use client';

import * as React from 'react';
import { CircleCheck as CheckCircle, Loader as Loader2, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { useWizard, type SaveState } from './wizard-context';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { CandidatePreviewDialog } from './candidate-preview-dialog';

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'saving') {
    return (
      <span
        className="flex items-center gap-2 text-body-sm text-muted transition-opacity duration-200"
        aria-live="polite"
      >
        <Loader2 size={16} className="animate-spin" />
        Saving…
      </span>
    );
  }
  if (state === 'saved') {
    return (
      <span
        className="flex items-center gap-2 text-body-sm text-muted transition-opacity duration-200"
        aria-live="polite"
      >
        <CheckCircle size={16} className="text-muted" />
        Changes saved
      </span>
    );
  }
  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 text-body-sm text-error transition-opacity duration-200 hover:underline"
        aria-live="assertive"
      >
        <AlertCircle size={16} />
        Couldn&apos;t save — retry
      </button>
    );
  }
  return null;
}

export function TopBar() {
  const { job, saveState, retrySave, hasJob } = useWizard();
  const [previewOpen, setPreviewOpen] = React.useState(false);

  return (
    <header
      className="flex h-[72px] shrink-0 items-center justify-end gap-3 px-6 md:px-8"
      role="banner"
    >
      <SaveIndicator state={saveState} onRetry={retrySave} />

      {hasJob ? (
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
        >
          <Eye size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Preview landing page</span>
        </button>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                aria-label="Preview landing page (disabled until job is created)"
                className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-muted opacity-50"
              >
                <Eye size={16} strokeWidth={1.5} />
                <span className="hidden sm:inline">Preview landing page</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              The landing page becomes available once the job is created
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <CandidatePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
    </header>
  );
}
