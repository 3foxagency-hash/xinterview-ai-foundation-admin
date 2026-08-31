'use client';

import * as React from 'react';
import { Sparkles, FileText, Pencil, CircleAlert as AlertCircle, Loader as Loader2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor } from './rich-text-editor';
import { track } from '@/lib/utils/analytics';

export type JobDescriptionViewState =
  | 'empty'
  | 'summary'
  | 'editing'
  | 'ai_draft'
  | 'ai_compare'
  | 'ai_error';

interface JobDescriptionSectionProps {
  value: string;
  onChange: (value: string) => void;
  jobTitle: string;
  onGenerate: () => Promise<string | null>;
  generating: boolean;
  view: JobDescriptionViewState;
  onViewChange: (view: JobDescriptionViewState) => void;
}

/** Bold, Italic, Bullet list, Numbered list, Link, one heading level (§6). */
const DESCRIPTION_TOOLBAR = ['Bold', 'Italic', 'Bullet list', 'Numbered list', 'Link', 'Heading 1'];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function JobDescriptionSection({
  value,
  onChange,
  jobTitle,
  onGenerate,
  generating,
  view,
  onViewChange: setView,
}: JobDescriptionSectionProps) {
  const [aiDraft, setAiDraft] = React.useState('');
  const [generateError, setGenerateError] = React.useState(false);
  // Local, render-safe flag for the loading UI — the parent's `generating`
  // prop only flips back once the mock request resolves, which is too slow
  // for Cancel to feel instant.
  const [isGenerating, setIsGenerating] = React.useState(false);
  // Ref (not state, deliberately not read during render): set the instant
  // the user clicks Cancel, so the in-flight generate promise can check it
  // before acting on its result and discard a late resolve after cancel.
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    if (!generating && view !== 'editing' && view !== 'ai_draft' && view !== 'ai_compare') {
      if (value && view === 'empty') setView('summary');
      if (!value && view === 'summary') setView('empty');
    }
  }, [value, view, generating, setView]);

  const canGenerate = jobTitle.trim().length >= 2;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerateError(false);
    cancelledRef.current = false;
    setIsGenerating(true);
    const draft = await onGenerate();
    if (cancelledRef.current) return;
    setIsGenerating(false);
    if (draft === null) {
      setGenerateError(true);
      setView('ai_error');
      return;
    }
    setAiDraft(draft);
    setView(value ? 'ai_compare' : 'ai_draft');
  };

  const handleCancelGenerate = () => {
    cancelledRef.current = true;
    setIsGenerating(false);
    setGenerateError(false);
    setView(value ? 'summary' : 'empty');
  };

  const handleKeepDraft = () => {
    onChange(aiDraft);
    setView('summary');
    track('job_description_ai_draft_kept');
  };

  const handleDiscardDraft = () => {
    setAiDraft('');
    setView(value ? 'summary' : 'empty');
    track('job_description_ai_draft_discarded');
  };

  const handleReplace = () => {
    onChange(aiDraft);
    setAiDraft('');
    setView('summary');
    track('job_description_ai_draft_kept');
  };

  const handleCancelCompare = () => {
    setAiDraft('');
    setView(value ? 'summary' : 'empty');
    track('job_description_ai_draft_discarded');
  };

  const handleRetry = () => {
    setGenerateError(false);
    setView(value ? 'summary' : 'empty');
    void handleGenerate();
  };

  const charCount = stripHtml(value).length;
  const showGenerating = isGenerating;

  if (view === 'empty') {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center gap-2 text-muted">
          <FileText size={20} strokeWidth={1.5} />
          <p className="text-body text-muted">
            No description yet. A short summary helps candidates understand the role.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setView('editing')}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-button text-heading transition-colors hover:bg-card-hover"
          >
            <Pencil size={16} /> Write description
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || showGenerating}
            aria-busy={showGenerating}
            title={!canGenerate ? 'Add a job title first.' : undefined}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-transparent px-4 text-button text-primary transition-colors hover:bg-active-menu-bg disabled:pointer-events-none disabled:opacity-50"
          >
            <Sparkles size={16} /> Generate with AI
          </button>
        </div>
        {showGenerating && (
          <div className="mt-4 flex items-center gap-2 text-body-sm text-muted">
            <Loader2 size={14} className="animate-spin" /> Generating draft…
            <button
              type="button"
              onClick={handleCancelGenerate}
              className="ml-2 text-body-sm text-muted hover:text-heading"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  if (view === 'summary') {
    // Edit description lives in the card's header (job-details-form.tsx),
    // not here, so this is a plain read-only preview.
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="text-body text-bodyText line-clamp-3">{stripHtml(value) || 'No description yet.'}</p>
        <p className="mt-2 text-caption tabular-nums text-muted">{charCount} characters</p>
      </div>
    );
  }

  if (view === 'ai_error') {
    return (
      <div className="rounded-lg border border-error-border bg-error-wash p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 text-error" />
          <div className="flex-1">
            <p className="text-body text-error-ink">
              Couldn&apos;t generate a description. Try again, or write it yourself.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => setView(value ? 'summary' : 'empty')}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong px-4 text-button text-heading transition-colors hover:bg-card-hover"
              >
                Write it yourself
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'ai_draft') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-active-menu-bg px-4 py-2.5">
          <span className="text-body-sm font-medium text-primary">
            AI draft — review and edit before saving
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong px-3 text-caption text-heading transition-colors hover:bg-card-hover"
            >
              <X size={14} /> Discard
            </button>
            <button
              type="button"
              onClick={handleKeepDraft}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-caption text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Check size={14} /> Keep
            </button>
          </div>
        </div>
        <RichTextEditor value={aiDraft} onChange={setAiDraft} allowedToolbar={DESCRIPTION_TOOLBAR} />
      </div>
    );
  }

  if (view === 'ai_compare') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-active-menu-bg px-4 py-2.5">
          <span className="text-body-sm font-medium text-primary">
            AI draft — review and edit before saving
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelCompare}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong px-3 text-caption text-heading transition-colors hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReplace}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-caption text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Replace
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-body-sm font-semibold text-muted">Current</p>
            <div className="rounded-md border border-border bg-surface p-4 text-body-sm text-bodyText max-h-[300px] overflow-y-auto">
              {stripHtml(value) || 'Empty'}
            </div>
          </div>
          <div>
            <p className="mb-2 text-body-sm font-semibold text-primary">AI draft</p>
            <RichTextEditor value={aiDraft} onChange={setAiDraft} allowedToolbar={DESCRIPTION_TOOLBAR} />
          </div>
        </div>
      </div>
    );
  }

  // editing
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-body-sm font-semibold text-heading">Job description</span>
        <button
          type="button"
          onClick={() => setView(value ? 'summary' : 'empty')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong px-3 text-caption text-heading transition-colors hover:bg-card-hover"
        >
          Done editing
        </button>
      </div>
      <RichTextEditor
        value={value}
        onChange={onChange}
        generating={generating}
        allowedToolbar={DESCRIPTION_TOOLBAR}
      />
    </div>
  );
}
