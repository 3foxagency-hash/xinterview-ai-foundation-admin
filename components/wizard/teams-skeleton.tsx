import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-border', className)} />;
}

/** Loading state for /jobs/[id]/edit/teams. Mirrors the rail + main column layout. */
export function TeamsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]" aria-hidden>
      {/* Left rail */}
      <div className="hidden rounded-lg border border-border bg-surface p-4 lg:block">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-2 h-3 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>

      {/* Main column */}
      <div className="space-y-4">
        {/* Job owner */}
        <Skeleton className="h-24 w-full rounded-lg" />

        {/* Team members card */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
