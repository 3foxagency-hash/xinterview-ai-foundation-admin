'use client';

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Link as LinkIcon,
  Quote,
  Code,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  generating?: boolean;
}

type ToolbarButton = {
  icon: typeof Bold;
  label: string;
  group: number;
};

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, label: 'Bold', group: 0 },
  { icon: Italic, label: 'Italic', group: 0 },
  { icon: Underline, label: 'Underline', group: 0 },
  { icon: Heading1, label: 'Heading 1', group: 1 },
  { icon: Heading2, label: 'Heading 2', group: 1 },
  { icon: List, label: 'Bullet list', group: 2 },
  { icon: ListOrdered, label: 'Numbered list', group: 2 },
  { icon: ListChecks, label: 'Checklist', group: 2 },
  { icon: LinkIcon, label: 'Link', group: 3 },
  { icon: Quote, label: 'Blockquote', group: 3 },
  { icon: Code, label: 'Code', group: 3 },
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing, or generate with AI…',
  maxLength = 5000,
  generating = false,
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

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
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
        <div
          className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-2"
          role="toolbar"
          aria-label="Formatting options"
        >
          {TOOLBAR_BUTTONS.map((btn, i) => {
            const Icon = btn.icon;
            const prevBtn = TOOLBAR_BUTTONS[i - 1];
            const showDivider = prevBtn && prevBtn.group !== btn.group;
            const handleClick = () => {
              switch (btn.label) {
                case 'Heading 1': exec('formatBlock', 'H1'); break;
                case 'Heading 2': exec('formatBlock', 'H2'); break;
                case 'Bullet list': exec('insertUnorderedList'); break;
                case 'Numbered list': exec('insertOrderedList'); break;
                case 'Checklist': exec('insertUnorderedList'); break;
                case 'Link': handleLink(); break;
                case 'Blockquote': exec('formatBlock', 'BLOCKQUOTE'); break;
                case 'Code': exec('formatBlock', 'PRE'); break;
                default: exec(btn.label.toLowerCase().replace(' ', ''));
              }
            };
            return (
              <React.Fragment key={btn.label}>
                {showDivider && <div className="mx-1 h-6 w-px shrink-0 bg-border" />}
                <button
                  type="button"
                  onClick={handleClick}
                  aria-label={btn.label}
                  title={btn.label}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-bodyText transition-colors hover:bg-card-hover"
                >
                  <Icon size={16} strokeWidth={1.5} />
                </button>
              </React.Fragment>
            );
          })}
        </div>

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
