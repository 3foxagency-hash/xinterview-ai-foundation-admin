'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import type { CreditBreakdown } from '@/lib/api/settings';

interface CreditBreakdownPopoverProps {
  items: CreditBreakdown[];
  total: { used: number; limit: number };
}

/**
 * Info affordance beside the AI credits meter.
 *
 * Deliberately not the Radix Popover: that moves focus into the panel on open,
 * which fights hover-to-reveal (Escape and mouse-leave never reach the
 * trigger). This is a plain anchored panel that opens on hover, focus and
 * click, and closes on Escape, blur or an outside click.
 */
export function CreditBreakdownPopover({ items, total }: CreditBreakdownPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  React.useEffect(() => cancelClose, []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label="What uses AI credits?"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={scheduleClose}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Info size={14} />
      </button>

      {open && (
        <span
          role="tooltip"
          // Left-anchored rather than centred: the AI credits meter sits in the
          // left column, and a centred panel gets clipped by the card edge.
          className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-surface text-left shadow-lg"
        >
          <span className="block border-b border-border px-3 py-2.5">
            <span className="block text-body-sm font-medium text-heading">
              What uses AI credits
            </span>
            <span className="mt-0.5 block text-caption text-muted">
              Your allowance is shared across these features.
            </span>
          </span>

          <span className="flex flex-col gap-2 px-3 py-2.5">
            {items.map((c) => (
              <span key={c.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-body-sm text-bodyText">{c.label}</span>
                <span className="shrink-0 text-body-sm tabular-nums text-muted">
                  {c.used} / {c.limit}
                </span>
              </span>
            ))}
          </span>

          <span className="flex items-baseline justify-between gap-3 border-t border-border px-3 py-2.5">
            <span className="text-body-sm font-medium text-heading">Total</span>
            <span className="text-body-sm font-medium tabular-nums text-heading">
              {total.used} / {total.limit}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
