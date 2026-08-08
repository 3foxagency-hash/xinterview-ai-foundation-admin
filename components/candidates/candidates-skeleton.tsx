import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for /candidates. Mirrors the redesigned layout. */
export function CandidatesSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-3 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Stage chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {['w-14', 'w-20', 'w-24', 'w-20', 'w-28', 'w-24', 'w-20', 'w-16'].map((w, i) => (
          <Skeleton key={i} className={cn('h-8 rounded-md', w)} />
        ))}
      </div>

      {/* Search + job filter */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 rounded-md sm:w-56" />
      </div>

      <Skeleton className="mt-3 h-3.5 w-32" />

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-surface">
        <div className="hidden h-10 border-b border-border xl:block" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-3 p-4', i > 0 && 'border-t border-border')}
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-56" />
            </div>
            <Skeleton className="hidden h-6 w-24 shrink-0 rounded-full sm:block" />
            <Skeleton className="hidden h-8 w-28 shrink-0 rounded-md xl:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
