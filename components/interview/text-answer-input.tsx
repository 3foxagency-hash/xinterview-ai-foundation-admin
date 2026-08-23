'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { strings } from '@/lib/interview/strings';
import type { SessionQuestion } from '@/config/interview-session';

interface TextAnswerInputProps {
  question: SessionQuestion;
  value: string;
  onChange: (value: string) => void;
  storageKey: string;
  disabled?: boolean;
}

export function TextAnswerInput({
  question,
  value,
  onChange,
  storageKey,
  disabled,
}: TextAnswerInputProps) {
  const maxChars = question.maxCharacters ?? 1000;
  const blockPaste = question.blockPaste ?? false;
  const [pasteWarn, setPasteWarn] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const warnTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveTimer = React.useRef<ReturnType<typeof setInterval>>(undefined);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) onChange(saved);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  React.useEffect(() => {
    const id = setInterval(() => {
      try {
        localStorage.setItem(storageKey, value);
        setSaved(true);
      } catch { /* ignore */ }
    }, 2000);
    saveTimer.current = id;
    return () => clearInterval(id);
  }, [value, storageKey]);

  const handleBlur = () => {
    try {
      localStorage.setItem(storageKey, value);
      setSaved(true);
    } catch { /* ignore */ }
  };

  const showPasteWarning = () => {
    setPasteWarn(true);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => setPasteWarn(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!blockPaste) return;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.key === 'v' || e.key === 'c' || e.key === 'x' || e.key === 'a')) {
      e.preventDefault();
      showPasteWarning();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (blockPaste) {
      e.preventDefault();
      showPasteWarning();
    }
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    if (blockPaste) e.preventDefault();
  };

  const handleCut = (e: React.ClipboardEvent) => {
    if (blockPaste) {
      e.preventDefault();
      showPasteWarning();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (blockPaste) {
      e.preventDefault();
      showPasteWarning();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, maxChars);
    onChange(newValue);
    setSaved(false);
  };

  const charCount = value.length;
  const nearLimit = charCount >= maxChars * 0.95;

  React.useEffect(() => {
    const onContext = (e: Event) => {
      if (blockPaste && textareaRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    if (blockPaste) {
      document.addEventListener('contextmenu', onContext);
      return () => document.removeEventListener('contextmenu', onContext);
    }
  }, [blockPaste]);

  return (
    <div className="iv-text-answer">
      <hr className="iv-text-rule-top" />
      <textarea
        ref={textareaRef}
        className="iv-text-region"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCopy={handleCopy}
        onCut={handleCut}
        onDrop={handleDrop}
        onBlur={handleBlur}
        placeholder={strings.textPlaceholder}
        disabled={disabled}
        aria-label="Written answer"
        maxLength={maxChars}
        style={{ cursor: 'text' }}
      />
      <hr className="iv-text-rule-bottom" />
      <div className="iv-text-meta-row">
        <span className={`iv-text-charcount ${nearLimit ? 'warning' : ''}`}>
          {strings.textCharCount(charCount, maxChars)}
        </span>
        <span className="iv-text-saved">
          {saved && (
            <>
              <Check size={12} strokeWidth={1.5} aria-hidden="true" />
              {strings.textDraftSaved}
            </>
          )}
        </span>
      </div>
      {pasteWarn && (
        <p className="iv-text-paste-warn" role="alert">
          {strings.textPasteBlocked}
        </p>
      )}
    </div>
  );
}
