import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/**
 * Loading state for Settings → Team members. Mirrors the real page: title,
 * scope line, description, seat meter beside the Invite button, then the
 * roster table with its five columns. Matching the real geometry keeps the
 * layout from shifting when the roster arrives.
 */
export function TeamSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-8 py-8" aria-hidden>
      {/* Page header — title, scope line, description */}
      <Skeleton className="h-8 w-44" />
      <Skeleton className="mt-3 h-4 w-72" />
      <Skeleton className="mt-4 h-4 w-80" />

      {/* Seat meter + Invite button */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-1.5 w-48 rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Roster table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        {/* Column headers */}
        <div className="flex items-center gap-4 border-b border-border bg-muted-bg px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="ml-auto h-3 w-28" />
          <Skeleton className="h-3 w-14" />
        </div>

        {/* Member rows — avatar, name/email, role, status, date, actions */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 px-4 py-3',
              i > 0 && 'border-t border-border'
            )}
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="ml-auto h-5 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
