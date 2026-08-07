import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one carrier for "this was machine-generated" (§16).
 *
 * Achromatic by design: a mono uppercase `AI` label plus a single 16px sparkle,
 * both in gray-900. No purple fill, no coloured tile — the marker is expressed
 * through form, not hue, so it stays legible for colour-blind users and survives
 * in both themes.
 *
 * Use it everywhere AI output appears, and nowhere else. The moment it shows up
 * on something a human wrote, it stops meaning anything.
 */
export function AIMarker({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5', className)}>
      <Sparkles size={16} strokeWidth={1.5} className="text-muted" aria-hidden />
      <span className="font-mono text-caption font-medium uppercase tracking-[0.4px] text-muted">
        AI
      </span>
    </span>
  );
}

/**
 * Wrapper for a block of AI-generated content: a gray-400 ring over the
 * secondary surface, so the block is set apart by surface rather than colour.
 */
export function AIBlock({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-[var(--background-200)] p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AIMarker />
          <span className="truncate text-body font-medium text-heading">{title}</span>
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
