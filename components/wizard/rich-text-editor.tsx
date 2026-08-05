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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Sync content when value changes externally (e.g. AI generation)
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

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

  const toolbar = (
    <div
      className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-2"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-bodyText transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icon size={16} strokeWidth={1.5} />
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  const editorBody = (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable={!generating}
        onInput={handleInput}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cn(
          'min-h-[200px] overflow-y-auto p-4 text-body-lg text-heading outline-none',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted',
          'focus:outline-none',
          generating && 'pointer-events-none opacity-60'
        )}
        style={{ maxHeight: fullscreen ? '70vh' : '400px' }}
      />
      <div className="absolute bottom-3 right-4 flex items-center gap-2">
        {generating && (
          <span className="flex items-center gap-1.5 text-caption text-accent-ai">
            <Loader2 size={12} className="animate-spin" />
            Generating…
          </span>
        )}
        <span className="text-caption tabular-nums text-muted">
          {charCount}/{maxLength}
        </span>
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? 'Exit full screen' : 'Open full screen'}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-card-hover hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <Dialog open onOpenChange={() => setFullscreen(false)}>
        <DialogContent className="max-h-[90vh] flex h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
          <DialogTitle className="sr-only">Edit description</DialogTitle>
          {toolbar}
          <div className="flex-1 overflow-y-auto">{editorBody}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
      {toolbar}
      {editorBody}
    </div>
  );
}
