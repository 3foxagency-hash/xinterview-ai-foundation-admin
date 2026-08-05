'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveBarProps {
  /** True when there are unsaved changes */
  visible: boolean;
  loading?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  message?: string;
  /** Shown briefly after a successful save */
  saved?: boolean;
}

/**
 * Sticky action bar for settings pages.
 *
 * The bar is always rendered so the Save action is discoverable — it used to
 * slide out of view entirely when the form was pristine, which left the page
 * with no visible way to save. Discard and the "unsaved changes" hint only
 * appear once something has actually changed.
 */
export function SaveBar({
  visible,
  loading,
  onDiscard,
  onSave,
  message,
  saved = false,
}: SaveBarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        'sticky bottom-0 left-0 z-20 flex items-center justify-end gap-3 border-t border-border bg-surface px-4 py-3',
        visible && 'shadow-md'
      )}
    >
      <span
        className={cn(
          'mr-auto text-body-sm transition-opacity duration-200',
          visible ? 'text-bodyText opacity-100' : 'opacity-0'
        )}
      >
        {message ?? 'You have unsaved changes'}
      </span>

      {saved && !visible && !loading && (
        <span className="inline-flex items-center gap-1.5 text-body-sm text-success">
          <Check size={14} strokeWidth={2.5} />
          Saved
        </span>
      )}

      <button
        type="button"
        onClick={onDiscard}
        disabled={loading || !visible}
        className={cn(
          'inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-all hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          !visible && 'pointer-events-none opacity-0'
        )}
      >
        Discard
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={loading || !visible}
        aria-busy={loading}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-5 text-button text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
