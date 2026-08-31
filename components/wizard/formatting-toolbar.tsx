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
} from 'lucide-react';

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

/**
 * The formatting toolbar shared by every `contentEditable`-based editor
 * (the plain rich-text editor, and the placeholder-chip editor used by the
 * email template dialog). Pulled out on its own so both call `exec` the
 * same way instead of keeping two copies of this button list in sync.
 */
export function FormattingToolbar({
  exec,
  allowed,
}: {
  exec: (command: string, value?: string) => void;
  /** Restrict to a subset of button labels (e.g. the job-description editor's
   * limited set). Omit to show every button — the placeholder-chip editor's
   * existing full toolbar. */
  allowed?: string[];
}) {
  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  };

  const buttons = allowed
    ? TOOLBAR_BUTTONS.filter((btn) => allowed.includes(btn.label))
    : TOOLBAR_BUTTONS;

  return (
    <div
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-2"
      role="toolbar"
      aria-label="Formatting options"
    >
      {buttons.map((btn, i) => {
        const Icon = btn.icon;
        const prevBtn = buttons[i - 1];
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
  );
}
