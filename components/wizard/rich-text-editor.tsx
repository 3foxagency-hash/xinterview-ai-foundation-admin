'use client';

import * as React from 'react';
import { Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattingToolbar } from './formatting-toolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  generating?: boolean;
  /** Restrict the toolbar to a subset of buttons (see FormattingToolbar). */
  allowedToolbar?: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing, or generate with AI…',
  maxLength = 5000,
  generating = false,
  allowedToolbar,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const wasFullscreen = React.useRef(false);
  const toggleButtonRef = React.useRef<HTMLButtonElement>(null);

  // Set content only when it changes for a reason other than the user's own
  // typing (initial load, AI generation). The editable div below is never
  // unmounted when toggling fullscreen — an earlier version swapped in a
  // whole separate Dialog-portaled element for the fullscreen view, which
  // meant a fresh, empty contentEditable div every time even though `value`
  // itself was intact. Keeping one element in place means there's nothing
  // that needs to "carry forward".
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Trap focus, close on Escape, restore focus to the trigger on close (§14).
  React.useEffect(() => {
    if (!fullscreen) {
      if (wasFullscreen.current) toggleButtonRef.current?.focus();
      wasFullscreen.current = false;
      return;
    }
    wasFullscreen.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [fullscreen]);

  const exec = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const charCount = stripHtml(value).length;

  return (
    <>
      {fullscreen && (
        <div
          className="fixed inset-0 z-modal-backdrop bg-overlay"
          onClick={() => setFullscreen(false)}
          aria-hidden="true"
        />
      )}
      <div
        role={fullscreen ? 'dialog' : undefined}
        aria-modal={fullscreen ? true : undefined}
        aria-label={fullscreen ? 'Edit description' : undefined}
        className={cn(
          fullscreen
            ? 'fixed left-1/2 top-1/2 z-modal flex h-[90vh] w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-surface shadow-xl'
            : 'rounded-md border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background'
        )}
      >
        <FormattingToolbar exec={exec} allowed={allowedToolbar} />

        <div className={cn('relative', fullscreen && 'min-h-0 flex-1')}>
          <div
            ref={editorRef}
            contentEditable={!generating}
            onInput={handleInput}
            suppressContentEditableWarning
            data-placeholder={placeholder}
            className={cn(
              'overflow-y-auto p-4 text-body-lg text-heading outline-none',
              '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted',
              'focus:outline-none',
              generating && 'pointer-events-none opacity-60',
              fullscreen ? 'h-full' : 'min-h-[200px] max-h-[400px]'
            )}
          />
          <div className="absolute bottom-3 right-4 flex items-center gap-2">
            {generating && (
              <span className="flex items-center gap-1.5 font-mono text-caption uppercase tracking-[0.4px] text-muted">
                <Loader2 size={12} className="animate-spin" />
                Generating…
              </span>
            )}
            <span className="text-caption tabular-nums text-muted">
              {charCount}/{maxLength}
            </span>
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? 'Exit full screen' : 'Open full screen'}
              className="flex h-7 w-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-card-hover hover:text-heading"
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
