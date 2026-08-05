'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveBarProps {
  visible: boolean;
  loading?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  message?: string;
}

export function SaveBar({ visible, loading, onDiscard, onSave, message }: SaveBarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        'sticky bottom-0 left-0 z-20 flex items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 shadow-md transition-transform duration-200 motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      )}
    >
      <span className="text-body-sm text-bodyText">
        {message ?? 'You have unsaved changes'}
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-transparent px-4 text-button text-heading transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          aria-busy={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-button text-primary-foreground shadow-sm transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}
