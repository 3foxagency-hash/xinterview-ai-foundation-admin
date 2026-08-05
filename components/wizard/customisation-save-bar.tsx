'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomisationSaveBarProps {
  onSave: () => void | Promise<void>;
  /** Shown after a successful save until the user edits again */
  saved?: boolean;
  saving?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * Persistent save action for every customisation section. Sections autosave on
 * a debounce, but an explicit button gives people a way to commit immediately
 * and confirms that their change landed.
 */
export function CustomisationSaveBar({
  onSave,
  saved = false,
  saving = false,
  disabled = false,
  label = 'Save changes',
}: CustomisationSaveBarProps) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
      <span
        aria-live="polite"
        className={cn(
          'text-body-sm transition-opacity duration-200',
          saved && !saving ? 'text-success opacity-100' : 'opacity-0'
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <Check size={14} strokeWidth={2.5} />
          Saved
        </span>
      </span>

      <button
        type="button"
        onClick={onSave}
        disabled={disabled || saving}
        aria-busy={saving}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-button text-primary-foreground shadow-sm transition-colors',
          'hover:bg-primary-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Saving…' : label}
      </button>
    </div>
  );
}
