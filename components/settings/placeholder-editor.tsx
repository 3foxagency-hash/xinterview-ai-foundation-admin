'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FormattingToolbar } from '@/components/wizard/formatting-toolbar';
import { toEditorHtml, fromEditorHtml, placeholderChipHtml } from './placeholder-tokens';

export interface PlaceholderEditorHandle {
  /** Inserts a placeholder chip at the last known cursor position. */
  insertPlaceholder: (token: string) => void;
}

interface PlaceholderEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** 'html' renders the bold/italic/etc. toolbar; 'plain' is a bare text surface (SMS has no markup). */
  mode?: 'html' | 'plain';
  placeholder?: string;
  className?: string;
  id?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}

/**
 * A `contentEditable` surface that renders `{{ token }}` placeholders as
 * atomic chips instead of literal characters — see placeholder-tokens.ts for
 * why. `value` in and out is always the plain stored string; the chip
 * rendering is purely a display concern that lives and dies inside this
 * component.
 */
export const PlaceholderEditor = React.forwardRef<PlaceholderEditorHandle, PlaceholderEditorProps>(
  function PlaceholderEditor(
    { value, onChange, mode = 'html', placeholder, className, id, ariaInvalid, ariaDescribedBy },
    ref
  ) {
    const editorRef = React.useRef<HTMLDivElement>(null);
    // The value this component itself just produced via onChange, so the
    // sync-from-props effect below can tell "the parent handed back what we
    // just sent it" apart from "the parent reset/loaded a new value" —
    // only the latter should re-render the chips and reset the caret.
    const lastEmitted = React.useRef<string | null>(null);
    const savedRange = React.useRef<Range | null>(null);

    React.useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (value === lastEmitted.current) return;
      el.innerHTML = toEditorHtml(value, mode);
    }, [value, mode]);

    const emit = React.useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const next = fromEditorHtml(el);
      lastEmitted.current = next;
      onChange(next);
    }, [onChange]);

    const exec = React.useCallback(
      (command: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, val);
        emit();
      },
      [emit]
    );

    const rememberSelection = React.useCallback(() => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        insertPlaceholder: (token: string) => {
          const el = editorRef.current;
          if (!el) return;
          el.focus();
          const sel = window.getSelection();
          if (sel && savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
          }
          document.execCommand('insertHTML', false, placeholderChipHtml(token));
          rememberSelection();
          emit();
        },
      }),
      [emit, rememberSelection]
    );

    return (
      <div
        className={cn(
          'rounded-md border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
          className
        )}
      >
        {mode === 'html' && <FormattingToolbar exec={exec} />}
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={emit}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onFocus={rememberSelection}
          onBlur={rememberSelection}
          className={cn(
            'overflow-y-auto p-3 text-body text-heading outline-none',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted',
            mode === 'plain' ? 'min-h-[100px] whitespace-pre-wrap' : 'min-h-[200px] max-h-[400px] text-body-lg'
          )}
        />
      </div>
    );
  }
);
